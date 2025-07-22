-- ================================================================
-- Tenant Default Analysis Platform - Database Schema
-- Migration 3: Analysis and File Management Tables
-- ================================================================

-- ----------------------------------------------------------------
-- Analysis Requests Table
-- Tracks all analysis requests and their processing status
-- ----------------------------------------------------------------
CREATE TABLE public.analysis_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Analysis parameters
  property_name text,
  property_address text,
  include_web_search boolean DEFAULT true,
  search_location jsonb, -- {city, state, zip_code, country}
  
  -- Processing status
  status public.analysis_status DEFAULT 'pending' NOT NULL,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  processing_time_ms integer,
  
  -- Error handling
  error_message text,
  retry_count integer DEFAULT 0,
  
  -- Analysis results summary
  total_tenants_analyzed integer,
  tenants_at_risk integer,
  average_risk_probability decimal(5,2),
  
  -- Metadata
  openai_model_used text,
  web_search_enabled boolean DEFAULT false,
  file_size_bytes bigint,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------
-- Uploaded Files Table
-- Manages rent roll documents and other uploaded files
-- ----------------------------------------------------------------
CREATE TABLE public.uploaded_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  analysis_request_id uuid REFERENCES public.analysis_requests(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  
  -- File information
  original_filename text NOT NULL,
  stored_filename text NOT NULL,
  file_size_bytes bigint NOT NULL,
  file_type text NOT NULL,
  document_type public.document_type DEFAULT 'rent_roll' NOT NULL,
  
  -- Storage information
  storage_bucket text NOT NULL DEFAULT 'rent-rolls',
  storage_path text NOT NULL,
  storage_url text,
  
  -- Processing status
  file_status public.file_status DEFAULT 'uploaded' NOT NULL,
  processed_at timestamp with time zone,
  processing_error text,
  
  -- File metadata
  file_hash text, -- For duplicate detection
  file_metadata jsonb DEFAULT '{}', -- Additional file properties
  
  -- Access and retention
  is_archived boolean DEFAULT false,
  archive_date timestamp with time zone,
  retention_until timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Constraints
  CONSTRAINT uploaded_files_file_size_check CHECK (file_size_bytes > 0),
  CONSTRAINT uploaded_files_storage_path_unique UNIQUE (storage_bucket, storage_path)
);

-- ----------------------------------------------------------------
-- Risk Assessments Table
-- Individual tenant risk assessments from analysis results
-- ----------------------------------------------------------------
CREATE TABLE public.risk_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_request_id uuid REFERENCES public.analysis_requests(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Tenant identification (from analysis, may not match existing tenant records)
  tenant_name text NOT NULL,
  unit_number text NOT NULL,
  
  -- Lease information from analysis
  lease_start_date date,
  lease_end_date date,
  monthly_rent numeric(10,2),
  security_deposit numeric(10,2),
  move_in_date date,
  
  -- Risk assessment results
  risk_severity public.risk_severity NOT NULL,
  default_probability decimal(5,2) NOT NULL CHECK (default_probability >= 0 AND default_probability <= 100),
  projected_default_timeframe text,
  confidence_level decimal(5,2) CHECK (confidence_level >= 0 AND confidence_level <= 100),
  
  -- Financial indicators from analysis
  financial_indicators public.financial_metrics,
  payment_pattern public.payment_pattern,
  payment_frequency text,
  
  -- Risk factors and context
  risk_factors text[] DEFAULT '{}',
  protective_factors text[] DEFAULT '{}',
  macroeconomic_context public.macro_context,
  
  -- AI analysis details
  comments text NOT NULL,
  analysis_reasoning text,
  data_quality_score decimal(5,2),
  
  -- Timestamps
  assessment_date timestamp with time zone DEFAULT now() NOT NULL,
  last_updated timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------
-- Recommended Actions Table
-- Action items generated by AI analysis
-- ----------------------------------------------------------------
CREATE TABLE public.recommended_actions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  risk_assessment_id uuid REFERENCES public.risk_assessments(id) ON DELETE CASCADE NOT NULL,
  analysis_request_id uuid REFERENCES public.analysis_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Action details
  action_type public.next_action_type NOT NULL,
  description text NOT NULL,
  priority public.priority_level NOT NULL,
  timeline text NOT NULL,
  
  -- Cost and requirements
  estimated_cost numeric(10,2),
  legal_requirements text[] DEFAULT '{}',
  
  -- Action status tracking
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  completed_by uuid REFERENCES public.user_profiles(id),
  completion_notes text,
  
  -- Follow-up actions
  follow_up_date date,
  follow_up_notes text,
  
  -- Metadata
  affected_tenants text[] DEFAULT '{}', -- List of tenant names/units
  tags text[] DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------
-- Analysis Summary Table
-- Overall property-level analysis results
-- ----------------------------------------------------------------
CREATE TABLE public.analysis_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_request_id uuid REFERENCES public.analysis_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  
  -- Property information
  property_name text,
  property_address text,
  total_units integer,
  analysis_date timestamp with time zone NOT NULL,
  
  -- Risk summary
  risk_summary public.risk_summary NOT NULL,
  
  -- Macroeconomic summary
  macroeconomic_data public.macro_context,
  major_employer_layoffs text[] DEFAULT '{}',
  economic_indicators text[] DEFAULT '{}',
  seasonal_factors text[] DEFAULT '{}',
  industry_trends text[] DEFAULT '{}',
  
  -- Data quality metrics
  data_completeness decimal(5,2) CHECK (data_completeness >= 0 AND data_completeness <= 100),
  confidence_score decimal(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_source_reliability text,
  web_search_timestamp timestamp with time zone,
  
  -- Analysis metadata
  openai_model_version text,
  analysis_version text DEFAULT '1.0',
  processing_notes text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------
-- Notifications Table
-- System notifications and alerts for users
-- ----------------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  analysis_request_id uuid REFERENCES public.analysis_requests(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type public.notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  
  -- Notification status
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  
  -- Action links and metadata
  action_url text,
  action_label text,
  metadata jsonb DEFAULT '{}',
  
  -- Priority and delivery
  priority public.priority_level DEFAULT 'normal',
  email_sent boolean DEFAULT false,
  email_sent_at timestamp with time zone,
  
  -- Expiration
  expires_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ----------------------------------------------------------------
-- Indexes for Performance
-- ----------------------------------------------------------------

-- Analysis requests indexes
CREATE INDEX idx_analysis_requests_user_id ON public.analysis_requests(user_id);
CREATE INDEX idx_analysis_requests_property_id ON public.analysis_requests(property_id);
CREATE INDEX idx_analysis_requests_status ON public.analysis_requests(status);
CREATE INDEX idx_analysis_requests_created_at ON public.analysis_requests(created_at DESC);
CREATE INDEX idx_analysis_requests_completed_at ON public.analysis_requests(completed_at DESC) WHERE completed_at IS NOT NULL;

-- Uploaded files indexes
CREATE INDEX idx_uploaded_files_user_id ON public.uploaded_files(user_id);
CREATE INDEX idx_uploaded_files_analysis_request_id ON public.uploaded_files(analysis_request_id);
CREATE INDEX idx_uploaded_files_property_id ON public.uploaded_files(property_id);
CREATE INDEX idx_uploaded_files_file_status ON public.uploaded_files(file_status);
CREATE INDEX idx_uploaded_files_document_type ON public.uploaded_files(document_type);
CREATE INDEX idx_uploaded_files_file_hash ON public.uploaded_files(file_hash) WHERE file_hash IS NOT NULL;

-- Risk assessments indexes
CREATE INDEX idx_risk_assessments_analysis_request_id ON public.risk_assessments(analysis_request_id);
CREATE INDEX idx_risk_assessments_tenant_id ON public.risk_assessments(tenant_id);
CREATE INDEX idx_risk_assessments_user_id ON public.risk_assessments(user_id);
CREATE INDEX idx_risk_assessments_property_id ON public.risk_assessments(property_id);
CREATE INDEX idx_risk_assessments_risk_severity ON public.risk_assessments(risk_severity);
CREATE INDEX idx_risk_assessments_default_probability ON public.risk_assessments(default_probability DESC);
CREATE INDEX idx_risk_assessments_assessment_date ON public.risk_assessments(assessment_date DESC);

-- Recommended actions indexes
CREATE INDEX idx_recommended_actions_risk_assessment_id ON public.recommended_actions(risk_assessment_id);
CREATE INDEX idx_recommended_actions_analysis_request_id ON public.recommended_actions(analysis_request_id);
CREATE INDEX idx_recommended_actions_user_id ON public.recommended_actions(user_id);
CREATE INDEX idx_recommended_actions_action_type ON public.recommended_actions(action_type);
CREATE INDEX idx_recommended_actions_priority ON public.recommended_actions(priority);
CREATE INDEX idx_recommended_actions_is_completed ON public.recommended_actions(is_completed);
CREATE INDEX idx_recommended_actions_follow_up_date ON public.recommended_actions(follow_up_date) WHERE follow_up_date IS NOT NULL;

-- Analysis summaries indexes
CREATE INDEX idx_analysis_summaries_analysis_request_id ON public.analysis_summaries(analysis_request_id);
CREATE INDEX idx_analysis_summaries_user_id ON public.analysis_summaries(user_id);
CREATE INDEX idx_analysis_summaries_property_id ON public.analysis_summaries(property_id);
CREATE INDEX idx_analysis_summaries_analysis_date ON public.analysis_summaries(analysis_date DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_property_id ON public.notifications(property_id);
CREATE INDEX idx_notifications_notification_type ON public.notifications(notification_type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- ----------------------------------------------------------------
-- Triggers for Automatic Updates
-- ----------------------------------------------------------------

CREATE TRIGGER update_analysis_requests_updated_at
  BEFORE UPDATE ON public.analysis_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_uploaded_files_updated_at
  BEFORE UPDATE ON public.uploaded_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recommended_actions_updated_at
  BEFORE UPDATE ON public.recommended_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_summaries_updated_at
  BEFORE UPDATE ON public.analysis_summaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ----------------------------------------------------------------
-- Comments for Documentation
-- ----------------------------------------------------------------

COMMENT ON TABLE public.analysis_requests IS 'Tracks all tenant default analysis requests and their processing status';
COMMENT ON TABLE public.uploaded_files IS 'Manages uploaded rent roll documents and other files';
COMMENT ON TABLE public.risk_assessments IS 'Individual tenant risk assessments from AI analysis';
COMMENT ON TABLE public.recommended_actions IS 'AI-generated action items for risk management';
COMMENT ON TABLE public.analysis_summaries IS 'Property-level analysis results and summaries';
COMMENT ON TABLE public.notifications IS 'System notifications and alerts for users';

COMMENT ON COLUMN public.risk_assessments.default_probability IS 'Probability of default as percentage (0-100)';
COMMENT ON COLUMN public.risk_assessments.confidence_level IS 'AI confidence in the assessment (0-100)';
COMMENT ON COLUMN public.uploaded_files.file_hash IS 'SHA-256 hash for duplicate detection';
COMMENT ON COLUMN public.analysis_summaries.data_completeness IS 'Percentage of complete data in the analysis (0-100)'; 