use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    self, Mint, TokenAccount, TokenInterface, TransferChecked,
};

declare_id!("BygtFoZ4xWpCuQteoYAoA1WFcqzF8aVeAQjex3Ym8xgX");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONFIG_SEED: &[u8] = b"config";
const STAKE_VAULT_SEED: &[u8] = b"stake_vault";
const REWARD_VAULT_SEED: &[u8] = b"reward_vault";
const STAKE_SEED: &[u8] = b"stake";

// u128 keeps all reward math in one unsigned type.
const SECONDS_PER_YEAR: u128 = 31_536_000; // 365 days

// Supported lock periods (in seconds) and their APY in basis points (100 bps = 1%).
const LOCK_3_WEEKS: i64 = 21 * 24 * 60 * 60; // 1_814_400
const LOCK_1_MONTH: i64 = 30 * 24 * 60 * 60; // 2_592_000
const LOCK_3_MONTHS: i64 = 90 * 24 * 60 * 60; // 7_776_000

const APY_3_WEEKS: u16 = 2500; // 25%
const APY_1_MONTH: u16 = 4000; // 40%
const APY_3_MONTHS: u16 = 6500; // 65%

const MIN_STAKE: u64 = 1; // raw units; UI enforces a higher human-readable minimum

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

#[program]
pub mod v1n3 {
    use super::*;

    /// One-time admin setup. Creates the global config plus the stake and reward
    /// vault token accounts (both owned by the config PDA). Must be signed by the
    /// wallet that will become the admin.
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.admin = ctx.accounts.admin.key();
        config.v1n3_mint = ctx.accounts.v1n3_mint.key();
        config.stake_vault = ctx.accounts.stake_vault.key();
        config.reward_vault = ctx.accounts.reward_vault.key();
        config.total_staked = 0;
        config.bump = ctx.bumps.config;

        msg!("V1N3 staking initialized. Admin: {}", config.admin);
        Ok(())
    }

    /// Admin deposits V1N3 into the reward vault so that staking rewards are
    /// actually backed by real tokens (keeps the pool solvent).
    pub fn fund_rewards(ctx: Context<FundRewards>, amount: u64) -> Result<()> {
        require!(amount > 0, StakingError::InvalidAmount);

        let decimals = ctx.accounts.v1n3_mint.decimals;
        token_interface::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.admin_ata.to_account_info(),
                    mint: ctx.accounts.v1n3_mint.to_account_info(),
                    to: ctx.accounts.reward_vault.to_account_info(),
                    authority: ctx.accounts.admin.to_account_info(),
                },
            ),
            amount,
            decimals,
        )?;

        msg!("Funded reward vault with {} (raw) V1N3", amount);
        Ok(())
    }

    /// Stake `amount` of V1N3 for a given `lock_period` (seconds). Transfers the
    /// principal from the user's token account into the stake vault and records
    /// a one-per-user stake account.
    pub fn stake(ctx: Context<Stake>, amount: u64, lock_period: i64) -> Result<()> {
        require!(amount >= MIN_STAKE, StakingError::InvalidAmount);

        let apy_bps = apy_for_lock_period(lock_period)?;
        let now = Clock::get()?.unix_timestamp;

        let decimals = ctx.accounts.v1n3_mint.decimals;
        token_interface::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.user_ata.to_account_info(),
                    mint: ctx.accounts.v1n3_mint.to_account_info(),
                    to: ctx.accounts.stake_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
            decimals,
        )?;

        let stake_account = &mut ctx.accounts.stake_account;
        stake_account.owner = ctx.accounts.user.key();
        stake_account.mint = ctx.accounts.v1n3_mint.key();
        stake_account.amount = amount;
        stake_account.lock_period = lock_period;
        stake_account.start_ts = now;
        stake_account.last_claim_ts = now;
        stake_account.apy_bps = apy_bps;
        stake_account.bump = ctx.bumps.stake_account;

        let config = &mut ctx.accounts.config;
        config.total_staked = config.total_staked.saturating_add(amount);

        msg!("Staked {} (raw) for {}s at {} bps", amount, lock_period, apy_bps);
        Ok(())
    }

    /// Claim accrued rewards without unstaking. Pays out from the reward vault and
    /// resets the reward accrual clock. Can be called any time.
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let (amount, apy_bps, last_claim) = {
            let s = &ctx.accounts.stake_account;
            (s.amount, s.apy_bps, s.last_claim_ts)
        };

        let pending = calc_rewards(amount, apy_bps, now.saturating_sub(last_claim));
        require!(pending > 0, StakingError::NothingToClaim);
        require!(
            ctx.accounts.reward_vault.amount >= pending,
            StakingError::InsufficientRewardVault
        );

        let bump = ctx.accounts.config.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[CONFIG_SEED, &[bump]]];
        let decimals = ctx.accounts.v1n3_mint.decimals;

        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.reward_vault.to_account_info(),
                    mint: ctx.accounts.v1n3_mint.to_account_info(),
                    to: ctx.accounts.user_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            ),
            pending,
            decimals,
        )?;

        ctx.accounts.stake_account.last_claim_ts = now;
        msg!("Claimed {} (raw) V1N3 rewards", pending);
        Ok(())
    }

    /// Unstake after the lock period elapses. Returns principal from the stake
    /// vault plus any remaining accrued rewards from the reward vault, then closes
    /// the stake account (rent refunded to the user).
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let (amount, apy_bps, start_ts, last_claim, lock_period) = {
            let s = &ctx.accounts.stake_account;
            (s.amount, s.apy_bps, s.start_ts, s.last_claim_ts, s.lock_period)
        };

        require!(
            now >= start_ts.saturating_add(lock_period),
            StakingError::StillLocked
        );

        let bump = ctx.accounts.config.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[CONFIG_SEED, &[bump]]];
        let decimals = ctx.accounts.v1n3_mint.decimals;

        // 1. Return principal from the stake vault.
        token_interface::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.stake_vault.to_account_info(),
                    mint: ctx.accounts.v1n3_mint.to_account_info(),
                    to: ctx.accounts.user_ata.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
            decimals,
        )?;

        // 2. Pay any remaining accrued rewards from the reward vault (best effort:
        //    capped by what the vault holds so unstaking principal never fails).
        let pending = calc_rewards(amount, apy_bps, now.saturating_sub(last_claim));
        let payable = pending.min(ctx.accounts.reward_vault.amount);
        if payable > 0 {
            token_interface::transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TransferChecked {
                        from: ctx.accounts.reward_vault.to_account_info(),
                        mint: ctx.accounts.v1n3_mint.to_account_info(),
                        to: ctx.accounts.user_ata.to_account_info(),
                        authority: ctx.accounts.config.to_account_info(),
                    },
                    signer_seeds,
                ),
                payable,
                decimals,
            )?;
        }

        let config = &mut ctx.accounts.config;
        config.total_staked = config.total_staked.saturating_sub(amount);

        msg!("Unstaked {} (raw) principal + {} (raw) rewards", amount, payable);
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn apy_for_lock_period(lock_period: i64) -> Result<u16> {
    match lock_period {
        LOCK_3_WEEKS => Ok(APY_3_WEEKS),
        LOCK_1_MONTH => Ok(APY_1_MONTH),
        LOCK_3_MONTHS => Ok(APY_3_MONTHS),
        _ => err!(StakingError::InvalidLockPeriod),
    }
}

/// rewards = amount * apy_bps * elapsed / (10_000 * SECONDS_PER_YEAR)
/// All intermediate math is done in u128 to avoid overflow and type mixing.
fn calc_rewards(amount: u64, apy_bps: u16, elapsed_secs: i64) -> u64 {
    if elapsed_secs <= 0 || amount == 0 || apy_bps == 0 {
        return 0;
    }
    let elapsed = elapsed_secs as u128; // safe: guarded > 0 above
    let numerator = (amount as u128)
        .saturating_mul(apy_bps as u128)
        .saturating_mul(elapsed);
    let denominator = 10_000u128.saturating_mul(SECONDS_PER_YEAR);
    (numerator / denominator) as u64
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub v1n3_mint: Pubkey,
    pub stake_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub total_staked: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub lock_period: i64,
    pub start_ts: i64,
    pub last_claim_ts: i64,
    pub apy_bps: u16,
    pub bump: u8,
}

// ---------------------------------------------------------------------------
// Account contexts  (field order == on-chain account order; the frontend must
// build instruction keys in exactly this order)
// ---------------------------------------------------------------------------

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [CONFIG_SEED],
        bump,
        space = 8 + Config::INIT_SPACE,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = admin,
        seeds = [STAKE_VAULT_SEED],
        bump,
        token::mint = v1n3_mint,
        token::authority = config,
        token::token_program = token_program,
    )]
    pub stake_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = admin,
        seeds = [REWARD_VAULT_SEED],
        bump,
        token::mint = v1n3_mint,
        token::authority = config,
        token::token_program = token_program,
    )]
    pub reward_vault: InterfaceAccount<'info, TokenAccount>,

    pub v1n3_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundRewards<'info> {
    #[account(mut, address = config.admin @ StakingError::Unauthorized)]
    pub admin: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_SEED],
        bump,
        token::mint = v1n3_mint,
        token::authority = config,
    )]
    pub reward_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = v1n3_mint,
        token::authority = admin,
    )]
    pub admin_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(address = config.v1n3_mint)]
    pub v1n3_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = user,
        seeds = [STAKE_SEED, user.key().as_ref()],
        bump,
        space = 8 + StakeAccount::INIT_SPACE,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [STAKE_VAULT_SEED],
        bump,
        token::mint = v1n3_mint,
        token::authority = config,
    )]
    pub stake_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = v1n3_mint,
        token::authority = user,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(address = config.v1n3_mint)]
    pub v1n3_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [STAKE_SEED, user.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == user.key() @ StakingError::Unauthorized,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_SEED],
        bump,
        token::mint = v1n3_mint,
        token::authority = config,
    )]
    pub reward_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = v1n3_mint,
        token::authority = user,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(address = config.v1n3_mint)]
    pub v1n3_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds = [STAKE_SEED, user.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == user.key() @ StakingError::Unauthorized,
        close = user,
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        seeds = [STAKE_VAULT_SEED],
        bump,
        token::mint = v1n3_mint,
        token::authority = config,
    )]
    pub stake_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [REWARD_VAULT_SEED],
        bump,
        token::mint = v1n3_mint,
        token::authority = config,
    )]
    pub reward_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = v1n3_mint,
        token::authority = user,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    #[account(address = config.v1n3_mint)]
    pub v1n3_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum StakingError {
    #[msg("Amount must be greater than zero")]
    InvalidAmount,
    #[msg("Unsupported lock period")]
    InvalidLockPeriod,
    #[msg("Tokens are still locked")]
    StillLocked,
    #[msg("No rewards available to claim")]
    NothingToClaim,
    #[msg("Reward vault has insufficient funds")]
    InsufficientRewardVault,
    #[msg("Unauthorized")]
    Unauthorized,
}
