-- ================================================================
-- Tenant Default Analysis Platform - Database Schema
-- Migration 6: Auto Profile Creation Trigger
-- ================================================================

-- Create trigger function for new user signup
-- This automatically creates a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_signup() 
RETURNS trigger
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        email, 
        full_name, 
        company_name,
        phone,
        timezone,
        subscription_plan,
        notification_preferences,
        dashboard_preferences,
        analysis_quota,
        analyses_used_this_month,
        is_active,
        trial_ends_at,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'company_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'timezone', 'America/New_York'),
        'starter', -- Default subscription plan
        '{"email": true, "risk_alerts": true, "analysis_complete": true}'::jsonb,
        '{"default_view": "overview", "show_tutorials": true}'::jsonb,
        10, -- Default starter quota
        0,  -- No analyses used yet
        true, -- Active by default
        (NOW() + INTERVAL '30 days'), -- 30 day trial
        NOW(),
        NOW()
    );
    RETURN NEW;
END;   
$$;

-- Create the trigger to fire after user insertion
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_signup();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user_signup() IS 'Automatically creates user profile when new user signs up';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Triggers profile creation after user signup'; 