-- Migration: Feed Page and Real-Time Notifications Enhancement
-- Date: 2026-05-21
-- Description: Documents the Feed page implementation and real-time notification subscriptions

-- No database changes required for this feature.
-- The Feed page uses existing news_articles and news_categories tables.
-- Real-time notifications use existing notifications table with Supabase Realtime.

-- Ensure Realtime is enabled for notifications table (should already be enabled)
-- Run this in Supabase SQL editor if not enabled:
-- alter publication supabase_realtime add table notifications;

-- Verify indexes exist for optimal Feed performance:
-- CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
-- CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_news_articles_is_featured ON news_articles(is_featured);
-- CREATE INDEX IF NOT EXISTS idx_news_articles_is_breaking ON news_articles(is_breaking);
-- CREATE INDEX IF NOT EXISTS idx_news_articles_category_id ON news_articles(category_id);

-- Feature Summary:
-- 1. Feed Page (/dashboard/feed) - Displays published articles for all users to read
-- 2. Individual Article View (/dashboard/feed/[slug]) - Full article with sharing, likes
-- 3. Real-time notification subscriptions using Supabase Realtime channels
-- 4. Rich Text Editor (Tiptap v3) for news article creation in News Studio
