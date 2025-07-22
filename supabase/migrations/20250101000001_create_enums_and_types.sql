-- ================================================================
-- Tenant Default Analysis Platform - Database Schema
-- Migration 1: Enums and Custom Types
-- ================================================================

-- Risk Severity Levels
CREATE TYPE public.risk_severity AS ENUM (
  'low',
  'medium', 
  'high',
  'critical'
);

-- Payment Patterns
CREATE TYPE public.payment_pattern AS ENUM (
  'on_time',
  'occasionally_late',
  'frequently_late', 
  'consistently_late',
  'in_arrears',
  'no_payment'
);

-- Next Action Types for Risk Management
CREATE TYPE public.next_action_type AS ENUM (
  'monitor',
  'contact_tenant',
  'payment_plan',
  'formal_notice',
  'legal_consultation',
  'eviction_process',
  'unit_preparation'
);

-- Priority Levels for Actions
CREATE TYPE public.priority_level AS ENUM (
  'immediate',
  'urgent',
  'normal',
  'low'
);

-- Analysis Status
CREATE TYPE public.analysis_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

-- Property Types
CREATE TYPE public.property_type AS ENUM (
  'single_family',
  'duplex',
  'triplex',
  'fourplex',
  'apartment_complex',
  'condominium',
  'townhouse',
  'mixed_use',
  'other'
);

-- Document Types for File Management
CREATE TYPE public.document_type AS ENUM (
  'rent_roll',
  'lease_agreement',
  'payment_history',
  'tenant_application',
  'background_check',
  'other'
);

-- File Processing Status
CREATE TYPE public.file_status AS ENUM (
  'uploaded',
  'processing',
  'processed',
  'failed',
  'archived'
);

-- Notification Types
CREATE TYPE public.notification_type AS ENUM (
  'risk_alert',
  'analysis_complete',
  'tenant_action_required',
  'system_update',
  'payment_overdue',
  'lease_expiring'
);

-- Tenant Status
CREATE TYPE public.tenant_status AS ENUM (
  'active',
  'notice_given',
  'vacated',
  'evicted',
  'lease_expired'
);

-- Address type for structured location data
CREATE TYPE public.address AS (
  street_address text,
  unit_number text,
  city text,
  state text,
  zip_code text,
  country text,
  latitude decimal,
  longitude decimal
);

-- Financial metrics type for tenant assessments
CREATE TYPE public.financial_metrics AS (
  current_arrears numeric(10,2),
  total_outstanding_balance numeric(10,2),
  last_payment_date date,
  last_payment_amount numeric(10,2),
  average_monthly_payment numeric(10,2),
  rent_to_income_ratio decimal(5,2),
  credit_score integer
);

-- Macroeconomic context type
CREATE TYPE public.macro_context AS (
  local_unemployment_rate decimal(5,2),
  city_unemployment_rate decimal(5,2),
  state_unemployment_rate decimal(5,2),
  median_income_area numeric(12,2),
  rent_growth_rate decimal(5,2),
  vacancy_rate decimal(5,2)
);

-- Risk assessment summary type
CREATE TYPE public.risk_summary AS (
  total_tenants integer,
  low_risk_count integer,
  medium_risk_count integer,
  high_risk_count integer,
  critical_risk_count integer,
  total_at_risk_tenants integer,
  average_default_probability decimal(5,2),
  projected_monthly_loss numeric(12,2)
);

-- Comment on the migration
COMMENT ON TYPE public.risk_severity IS 'Risk severity levels for tenant default analysis';
COMMENT ON TYPE public.payment_pattern IS 'Payment behavior patterns for tenants';
COMMENT ON TYPE public.next_action_type IS 'Recommended actions for risk management';
COMMENT ON TYPE public.priority_level IS 'Priority levels for recommended actions';
COMMENT ON TYPE public.analysis_status IS 'Status of analysis processing';
COMMENT ON TYPE public.property_type IS 'Types of rental properties';
COMMENT ON TYPE public.document_type IS 'Types of documents in the system';
COMMENT ON TYPE public.file_status IS 'File processing and storage status';
COMMENT ON TYPE public.notification_type IS 'Types of system notifications';
COMMENT ON TYPE public.tenant_status IS 'Current status of tenant leases'; 