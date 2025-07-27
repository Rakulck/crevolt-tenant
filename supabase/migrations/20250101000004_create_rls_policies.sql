-- ================================================================
-- Tenant Default Analysis Platform - Database Schema
-- Migration 4: Row Level Security (RLS) Policies
-- ================================================================

-- Enable RLS on all tables
-- ----------------------------------------------------------------

-- Core tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Analysis tables
ALTER TABLE public.analysis_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommended_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- User Profiles Policies
-- ================================================================

-- Users can only see and modify their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ================================================================
-- Properties Policies
-- ================================================================

-- Users can only access their own properties
CREATE POLICY "Users can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON public.properties
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Tenants Policies
-- ================================================================

-- Users can only access tenants in their properties
CREATE POLICY "Users can view own tenants" ON public.tenants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert tenants in own properties" ON public.tenants
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tenants" ON public.tenants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenants" ON public.tenants
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Analysis Requests Policies
-- ================================================================

-- Users can only access their own analysis requests
CREATE POLICY "Users can view own analysis requests" ON public.analysis_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis requests" ON public.analysis_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own analysis requests" ON public.analysis_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis requests" ON public.analysis_requests
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Uploaded Files Policies
-- ================================================================

-- Users can only access their own uploaded files
CREATE POLICY "Users can view own uploaded files" ON public.uploaded_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploaded files" ON public.uploaded_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploaded files" ON public.uploaded_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploaded files" ON public.uploaded_files
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Risk Assessments Policies
-- ================================================================

-- Users can only access risk assessments for their properties
CREATE POLICY "Users can view own risk assessments" ON public.risk_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk assessments" ON public.risk_assessments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.analysis_requests 
      WHERE id = analysis_request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own risk assessments" ON public.risk_assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own risk assessments" ON public.risk_assessments
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Recommended Actions Policies
-- ================================================================

-- Users can only access recommended actions for their assessments
CREATE POLICY "Users can view own recommended actions" ON public.recommended_actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommended actions" ON public.recommended_actions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.analysis_requests 
      WHERE id = analysis_request_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.risk_assessments 
      WHERE id = risk_assessment_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own recommended actions" ON public.recommended_actions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recommended actions" ON public.recommended_actions
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Analysis Summaries Policies
-- ================================================================

-- Users can only access summaries for their properties and analyses
CREATE POLICY "Users can view own analysis summaries" ON public.analysis_summaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis summaries" ON public.analysis_summaries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM public.analysis_requests 
      WHERE id = analysis_request_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own analysis summaries" ON public.analysis_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis summaries" ON public.analysis_summaries
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Notifications Policies
-- ================================================================

-- Users can only access their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications for users (for background processes)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ================================================================
-- Helper Functions for RLS
-- ================================================================

-- Function to check if user owns a property
CREATE OR REPLACE FUNCTION public.user_owns_property(property_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns an analysis request
CREATE OR REPLACE FUNCTION public.user_owns_analysis(analysis_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.analysis_requests 
    WHERE id = analysis_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has reached their analysis quota
CREATE OR REPLACE FUNCTION public.user_can_create_analysis()
RETURNS boolean AS $$
DECLARE
  user_quota integer;
  user_used integer;
BEGIN
  SELECT analysis_quota, analyses_used_this_month 
  INTO user_quota, user_used
  FROM public.user_profiles 
  WHERE id = auth.uid();
  
  RETURN (user_used < user_quota);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Additional Security Policies
-- ================================================================

-- Prevent users from creating too many analysis requests if over quota
CREATE POLICY "Users must be within quota to create analysis" ON public.analysis_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    public.user_can_create_analysis()
  );

-- Prevent modification of completed analysis requests
CREATE POLICY "Cannot modify completed analysis requests" ON public.analysis_requests
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    status != 'completed'
  );

-- Prevent deletion of files that are still being processed
CREATE POLICY "Cannot delete processing files" ON public.uploaded_files
  FOR DELETE USING (
    auth.uid() = user_id AND 
    file_status NOT IN ('processing')
  );

-- ================================================================
-- Grants for Service Role (for background processes)
-- ================================================================

-- Grant necessary permissions for service role to perform background tasks
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ================================================================
-- Comments for Documentation
-- ================================================================

COMMENT ON POLICY "Users can view own profile" ON public.user_profiles IS 
  'Users can only view their own profile information';

COMMENT ON POLICY "Users can view own properties" ON public.properties IS 
  'Users can only access properties they own';

COMMENT ON POLICY "Users can view own tenants" ON public.tenants IS 
  'Users can only access tenants in properties they own';

COMMENT ON POLICY "Users must be within quota to create analysis" ON public.analysis_requests IS 
  'Prevents users from exceeding their monthly analysis quota';

COMMENT ON FUNCTION public.user_can_create_analysis() IS 
  'Checks if user has remaining analysis quota for the current month'; 