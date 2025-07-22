-- ================================================================
-- Tenant Default Analysis Platform - Database Schema
-- Migration 2: Core Tables (User Profiles, Properties, Tenants)
-- ================================================================

-- ----------------------------------------------------------------
-- User Profiles Table
-- Extends Supabase auth.users with application-specific data
-- ----------------------------------------------------------------
CREATE TABLE public.user_profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  company_name text,
  phone text,
  timezone text DEFAULT 'America/New_York',
  
  -- Profile settings
  profile_image_url text,
  notification_preferences jsonb DEFAULT '{"email": true, "risk_alerts": true, "analysis_complete": true}',
  dashboard_preferences jsonb DEFAULT '{"default_view": "overview", "show_tutorials": true}',
  
  -- Subscription and usage tracking
  subscription_plan text DEFAULT 'starter', -- starter, professional, enterprise
  analysis_quota integer DEFAULT 10, -- Monthly analysis limit
  analyses_used_this_month integer DEFAULT 0,
  quota_reset_date date DEFAULT (date_trunc('month', now()) + interval '1 month')::date,
  
  -- Account status
  is_active boolean DEFAULT true,
  trial_ends_at timestamp with time zone,
  last_login_at timestamp with time zone,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT user_profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT user_profiles_subscription_plan_check CHECK (subscription_plan IN ('starter', 'professional', 'enterprise'))
);

-- ----------------------------------------------------------------
-- Properties Table
-- Core property information and location data
-- ----------------------------------------------------------------
CREATE TABLE public.properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic property information
  name text NOT NULL,
  description text,
  property_type public.property_type NOT NULL,
  
  -- Location information
  address public.address NOT NULL,
  
  -- Property details
  total_units integer NOT NULL CHECK (total_units > 0),
  year_built integer CHECK (year_built > 1800 AND year_built <= EXTRACT(YEAR FROM now())),
  square_footage numeric(10,2),
  lot_size numeric(10,2),
  
  -- Financial information
  acquisition_date date,
  acquisition_price numeric(15,2),
  current_market_value numeric(15,2),
  property_taxes numeric(10,2),
  insurance_cost numeric(10,2),
  
  -- Management information
  property_manager_name text,
  property_manager_email text,
  property_manager_phone text,
  management_company text,
  
  -- Property status and metadata
  is_active boolean DEFAULT true,
  notes text,
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT properties_property_manager_email_check 
    CHECK (property_manager_email IS NULL OR property_manager_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ----------------------------------------------------------------
-- Tenants Table
-- Individual tenant information and lease details
-- ----------------------------------------------------------------
CREATE TABLE public.tenants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Tenant identification
  tenant_name text NOT NULL,
  unit_number text NOT NULL,
  email text,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  
  -- Lease information
  lease_start_date date,
  lease_end_date date,
  move_in_date date,
  move_out_date date,
  lease_term_months integer,
  
  -- Financial terms
  monthly_rent numeric(10,2) NOT NULL CHECK (monthly_rent > 0),
  security_deposit numeric(10,2),
  pet_deposit numeric(10,2) DEFAULT 0,
  
  -- Current tenant status
  tenant_status public.tenant_status DEFAULT 'active' NOT NULL,
  
  -- Payment information
  payment_method text, -- 'check', 'ach', 'credit_card', 'cash', 'other'
  payment_due_date integer DEFAULT 1 CHECK (payment_due_date >= 1 AND payment_due_date <= 31),
  last_payment_date date,
  last_payment_amount numeric(10,2),
  
  -- Risk tracking
  current_balance numeric(10,2) DEFAULT 0, -- Positive = tenant owes money, Negative = credit
  days_behind integer DEFAULT 0,
  late_payment_count integer DEFAULT 0,
  last_risk_assessment_date timestamp with time zone,
  current_risk_level public.risk_severity,
  
  -- Tenant details
  number_of_occupants integer DEFAULT 1,
  pets_allowed boolean DEFAULT false,
  smoking_allowed boolean DEFAULT false,
  
  -- Notes and metadata
  notes text,
  tags text[] DEFAULT '{}',
  custom_fields jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Constraints
  UNIQUE(property_id, unit_number), -- One tenant per unit per property
  CONSTRAINT tenants_email_check 
    CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT tenants_lease_dates_check 
    CHECK (lease_start_date IS NULL OR lease_end_date IS NULL OR lease_start_date <= lease_end_date),
  CONSTRAINT tenants_move_dates_check 
    CHECK (move_in_date IS NULL OR move_out_date IS NULL OR move_in_date <= move_out_date)
);

-- ----------------------------------------------------------------
-- Indexes for Performance
-- ----------------------------------------------------------------

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_subscription_plan ON public.user_profiles(subscription_plan);
CREATE INDEX idx_user_profiles_trial_ends_at ON public.user_profiles(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- Properties indexes
CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_property_type ON public.properties(property_type);
CREATE INDEX idx_properties_is_active ON public.properties(is_active);
CREATE INDEX idx_properties_created_at ON public.properties(created_at);
CREATE INDEX idx_properties_address_city ON public.properties(((address).city));
CREATE INDEX idx_properties_address_state ON public.properties(((address).state));

-- Tenants indexes
CREATE INDEX idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX idx_tenants_user_id ON public.tenants(user_id);
CREATE INDEX idx_tenants_tenant_status ON public.tenants(tenant_status);
CREATE INDEX idx_tenants_current_risk_level ON public.tenants(current_risk_level);
CREATE INDEX idx_tenants_lease_end_date ON public.tenants(lease_end_date);
CREATE INDEX idx_tenants_last_payment_date ON public.tenants(last_payment_date);
CREATE INDEX idx_tenants_days_behind ON public.tenants(days_behind);
CREATE INDEX idx_tenants_current_balance ON public.tenants(current_balance);

-- ----------------------------------------------------------------
-- Functions for Automatic Updates
-- ----------------------------------------------------------------

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly analysis quota
CREATE OR REPLACE FUNCTION public.reset_monthly_quota()
RETURNS void AS $$
BEGIN
  UPDATE public.user_profiles 
  SET 
    analyses_used_this_month = 0,
    quota_reset_date = (date_trunc('month', now()) + interval '1 month')::date
  WHERE quota_reset_date <= now()::date;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------
-- Triggers for Automatic Updates
-- ----------------------------------------------------------------

-- Triggers for updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------
-- Comments for Documentation
-- ----------------------------------------------------------------

COMMENT ON TABLE public.user_profiles IS 'Extended user profile information and application settings';
COMMENT ON TABLE public.properties IS 'Property information including location, details, and management data';
COMMENT ON TABLE public.tenants IS 'Individual tenant records with lease and financial information';

COMMENT ON COLUMN public.user_profiles.analysis_quota IS 'Monthly analysis limit based on subscription plan';
COMMENT ON COLUMN public.user_profiles.analyses_used_this_month IS 'Number of analyses performed this month';
COMMENT ON COLUMN public.properties.address IS 'Structured address information including coordinates';
COMMENT ON COLUMN public.tenants.current_balance IS 'Current financial balance - positive means tenant owes money';
COMMENT ON COLUMN public.tenants.days_behind IS 'Number of days behind on rent payments'; 