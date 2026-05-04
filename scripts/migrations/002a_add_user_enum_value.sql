-- Migration 002a: Add 'user' to user_role enum
-- Created: 2026-05-02
-- Description: Adds 'user' value to user_role enum type
-- 
-- IMPORTANT: Run this FIRST, then run 002b after this succeeds.
-- PostgreSQL requires new enum values to be committed before they can be used.

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';
