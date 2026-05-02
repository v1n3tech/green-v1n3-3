-- Migration: create_profiles_table
-- Created: 2026-05-02
-- Description: Creates the comprehensive profiles table for AgroV1n3 with enums, indexes, RLS policies, and triggers

-- Create enum types for communities and roles
CREATE TYPE agro_community AS ENUM (
  'crop_farming',
  'animal_farming',
  'agro_marketing',
  'agro_processing',
  'agro_management_legislation',
  'agro_tourism',
  'agro_technology',
  'agro_healthcare',
  'agro_media_branding',
  'agro_security',
  'agro_literature',
  'agro_motivation_training',
  'agro_real_estate',
  'agro_logistics'
);

CREATE TYPE user_role AS ENUM (
  'agro_executive',
  'gcm',
  'lgpa',
  'scc_member',
  'admin'
);

CREATE TYPE verification_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic info
  email TEXT,
  wallet_address TEXT UNIQUE,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- AgroV1n3 specific
  agro_id TEXT UNIQUE,
  role user_role DEFAULT 'agro_executive',
  community agro_community,
  secondary_communities agro_community[] DEFAULT '{}',
  
  -- Location
  state TEXT DEFAULT 'Plateau',
  lga TEXT,
  address TEXT,
  
  -- Financial
  weekly_rating DECIMAL(5,2) DEFAULT 0,
  operational_rating DECIMAL(5,2) DEFAULT 0,
  total_earnings DECIMAL(15,2) DEFAULT 0,
  
  -- Social
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  -- Verification & Status
  verification_status verification_status DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX idx_profiles_agro_id ON public.profiles(agro_id);
CREATE INDEX idx_profiles_community ON public.profiles(community);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_lga ON public.profiles(lga);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles 
  FOR DELETE USING (auth.uid() = id);

-- Allow public read of basic profile info (for social features)
CREATE POLICY "profiles_select_public" ON public.profiles 
  FOR SELECT USING (true);

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    wallet_address,
    display_name,
    first_name,
    last_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'wallet_address', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    wallet_address = COALESCE(EXCLUDED.wallet_address, public.profiles.wallet_address),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Generate unique agro ID function
CREATE OR REPLACE FUNCTION public.generate_agro_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'AGE-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE agro_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$;
