'use client'

import { motion } from 'framer-motion'
import { Trophy, Flame, Target, Medal, Star, Crown, Zap, Gift } from 'lucide-react'

const leaderboard = [
  { rank: 1, name: 'Amina Yusuf', community: 'Crop Farming', points: 12450, streak: 45, avatar: 'AY' },
  { rank: 2, name: 'Ibrahim Kwache', community: 'Animal Farming', points: 11200, streak: 38, avatar: 'IK' },
  { rank: 3, name: 'Grace Musa', community: 'Agro Processing', points: 10890, streak: 32, avatar: 'GM' },
  { rank: 4, name: 'Daniel Pam', community: 'Agro Marketing', points: 9560, streak: 28, avatar: 'DP' },
  { rank: 5, name: 'Fatima Ali', community: 'Agro Tech', points: 8920, streak: 25, avatar: 'FA' },
]

const achievements = [
  { icon: Flame, title: 'Hot Streak', description: '7 days active', earned: true },
  { icon: Target, title: 'First Sale', description: 'Complete first transaction', earned: true },
  { icon: Medal, title: 'Top 100', description: 'Reach leaderboard top 100', earned: true },
  { icon: Star, title: 'Community Star', description: '50+ community interactions', earned: false },
  { icon: Crown, title: 'Executive Elite', description: 'Top 10 in your community', earned: false },
  { icon: Zap, title: 'Speed Demon', description: 'Complete 10 tasks in a day', earned: false },
]

const rewards = [
  { amount: '500', label: 'Daily Login', icon: Gift },
  { amount: '2,000', label: 'Task Complete', icon: Target },
  { amount: '5,000', label: 'Weekly Streak', icon: Flame },
  { amount: '10,000', label: 'Achievement', icon: Trophy },
]

export function GamificationSection() {
  return (
    <section className="relative py-24 px-4 md:px-8 lg:px-16">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      <div className="relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-border" />
            <span className="text-xs font-mono tracking-wider text-primary">/ 09 — REWARDS</span>
            <div className="w-8 h-px bg-border" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-mono leading-tight mb-4 text-balance">
            Earn as you <span className="text-primary">grow</span><span className="text-accent">.</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
            Complete tasks, maintain streaks, and climb the leaderboard to earn V1n3 tokens and exclusive rewards.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="p-6 rounded-sm border border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="size-5 text-accent" />
                <h3 className="font-mono text-sm">WEEKLY LEADERBOARD</h3>
                <span className="ml-auto text-xs font-mono text-muted-foreground">RESETS IN 3D 14H</span>
              </div>

              <div className="space-y-2">
                {leaderboard.map((user, i) => (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-4 p-3 rounded-sm ${
                      user.rank === 1 ? 'bg-accent/10 border border-accent/30' :
                      user.rank === 2 ? 'bg-primary/5 border border-primary/20' :
                      user.rank === 3 ? 'bg-orange-500/5 border border-orange-500/20' :
                      'bg-secondary/30 border border-border/30'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`flex items-center justify-center size-8 rounded-sm font-mono text-sm ${
                      user.rank === 1 ? 'bg-accent text-accent-foreground' :
                      user.rank === 2 ? 'bg-primary/20 text-primary' :
                      user.rank === 3 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {user.rank}
                    </div>

                    {/* Avatar */}
                    <div className="size-10 rounded-sm bg-secondary flex items-center justify-center font-mono text-sm">
                      {user.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.community}</div>
                    </div>

                    {/* Streak */}
                    <div className="flex items-center gap-1 text-xs">
                      <Flame className="size-3 text-orange-400" />
                      <span>{user.streak}</span>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="font-mono text-sm text-primary">{user.points.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">V1N3</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Achievements & Rewards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Achievements */}
            <div className="p-6 rounded-sm border border-border/50 bg-card/50">
              <div className="flex items-center gap-3 mb-4">
                <Medal className="size-5 text-primary" />
                <h3 className="font-mono text-sm">ACHIEVEMENTS</h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.title}
                    className={`p-3 rounded-sm border text-center ${
                      achievement.earned 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border/30 bg-muted/30 opacity-50'
                    }`}
                  >
                    <achievement.icon className={`size-5 mx-auto mb-1 ${achievement.earned ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-xs font-mono truncate">{achievement.title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* V1n3 Rewards */}
            <div className="p-6 rounded-sm border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 mb-4">
                <Gift className="size-5 text-primary" />
                <h3 className="font-mono text-sm">V1N3 REWARDS</h3>
              </div>

              <div className="space-y-2">
                {rewards.map((reward) => (
                  <div key={reward.label} className="flex items-center justify-between p-2 rounded-sm bg-background/50">
                    <div className="flex items-center gap-2">
                      <reward.icon className="size-4 text-primary" />
                      <span className="text-xs">{reward.label}</span>
                    </div>
                    <span className="font-mono text-sm text-primary">+{reward.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
