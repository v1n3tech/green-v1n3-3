# Supabase Auth — OTP Email Templates (NOT Magic Link)

This guide configures Supabase to send a **6-digit OTP code** instead of a magic link clickable URL, so the existing `verifyOtp` flow in `lib/auth/actions.ts` works correctly.

---

## How Supabase Decides: OTP vs Magic Link

When you call `supabase.auth.signInWithOtp({ email })`, Supabase will send **whichever variable your email template renders**:

- `{{ .Token }}` → renders the **6-digit OTP code** (what we want)
- `{{ .ConfirmationURL }}` → renders a **magic link URL** (what we DON'T want)

So the fix is purely a **template-level change** in the Supabase Dashboard.

---

## Where To Apply These Templates

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication → Email Templates**
3. Update **Magic Link**, **Confirm signup**, and (optionally) **Reauthentication**
4. Replace the body with the templates below
5. Save changes

> Note: There is no public Management API endpoint for email templates, so this MUST be done via the Dashboard. The templates below match the GreenV1n3 design system (Aldrich mono, primary green `#00c853`, dark `#020302` background).

---

## 1. "Magic Link" Template (used by signInWithOtp)

**Subject:** `Your GreenV1n3 verification code`

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>GreenV1n3 — Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#020302;font-family:'Courier New',monospace;color:#e8f0e8;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#020302;padding:48px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#060906;border:1px solid rgba(0,200,83,0.40);border-radius:3px;">
            <!-- Header -->
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid rgba(0,200,83,0.10);">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:11px;letter-spacing:0.2em;color:#00c853;text-transform:uppercase;">
                      GREEN<span style="color:#e8f0e8;">V1N3</span> / AUTH
                    </td>
                    <td align="right" style="font-size:10px;letter-spacing:0.15em;color:#4a5a4a;text-transform:uppercase;">
                      SECURE CHANNEL
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px 24px 24px 24px;">
                <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.2em;color:#4a5a4a;text-transform:uppercase;">
                  / 6-DIGIT VERIFICATION CODE
                </p>
                <h1 style="margin:0 0 24px 0;font-size:28px;line-height:1.2;color:#e8f0e8;font-weight:400;letter-spacing:-0.01em;">
                  Confirm it's you
                </h1>
                <p style="margin:0 0 32px 0;font-size:14px;line-height:1.6;color:rgba(232,240,232,0.7);">
                  Enter the code below in the GreenV1n3 connect window to finish signing in. This code expires in 60 minutes and can only be used once.
                </p>

                <!-- Code block -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
                  <tr>
                    <td align="center" style="background-color:#0a0f0a;border:1px solid rgba(0,200,83,0.40);border-radius:3px;padding:24px;">
                      <span style="font-family:'Courier New',monospace;font-size:32px;letter-spacing:0.5em;color:#00c853;font-weight:400;">
                        {{ .Token }}
                      </span>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;font-size:11px;line-height:1.5;color:#4a5a4a;letter-spacing:0.05em;">
                  If you didn't request this code, you can safely ignore this email — no action will be taken on your account.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 24px;border-top:1px solid rgba(0,200,83,0.10);">
                <p style="margin:0;font-size:9px;letter-spacing:0.2em;color:#4a5a4a;text-transform:uppercase;">
                  AGROV1N3 PROGRAM &nbsp;/&nbsp; PHASE 01 : PLATEAU STATE
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:16px 0 0 0;font-size:9px;letter-spacing:0.15em;color:#3a4a3a;text-transform:uppercase;">
            V1N3TECH.IO &nbsp;·&nbsp; CULTIVATING NIGERIA'S NEXT ECONOMY
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 2. "Confirm Signup" Template (first-time email signups)

**Subject:** `Confirm your GreenV1n3 account`

Use the **same HTML as above** — just change the heading copy if you want:

```html
<h1 ...>Confirm your account</h1>
<p ...>
  Welcome to GreenV1n3. Enter the code below in the connect window to activate your Agro Executive account.
</p>
```

The `{{ .Token }}` variable works identically here.

---

## 3. Important Settings to Verify

In **Authentication → Providers → Email**, make sure:

- `Enable Email provider` → **ON**
- `Confirm email` → **ON** (so first-time signups get the OTP code)
- `Secure email change` → ON (recommended)
- `Enable email OTP` → leave at default (the template change is what matters)

In **Authentication → URL Configuration**:

- Set `Site URL` to your production domain (so the redirect after OTP verification lands correctly).

---

## 4. Why The Code Already Works

Your `lib/auth/actions.ts` already calls `verifyOtp({ email, token, type: "email" })` — that's the correct OTP verification path. The only missing piece was the email template still rendering `{{ .ConfirmationURL }}` instead of `{{ .Token }}`. After saving the templates above, the modal's 6-digit code flow will work end-to-end.

---

## 5. Test Flow

1. Open the Connect modal → "Continue with Email"
2. Submit your email
3. Check inbox → you should see the **6-digit code** prominently rendered (no clickable link required)
4. Paste the code into the modal → success
