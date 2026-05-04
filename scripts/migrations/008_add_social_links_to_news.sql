-- Migration 008: Add social links to news articles
-- Created: 2026-05-04

-- Add social_links column to news_articles for optional social media links
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Add a comment describing the expected structure
COMMENT ON COLUMN public.news_articles.social_links IS 'JSON object containing social media links: { twitter?: string, facebook?: string, instagram?: string, linkedin?: string, youtube?: string, tiktok?: string }';
