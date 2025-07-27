-- ================================================================
-- Add Soft Credit Permission Field to Tenants Table
-- Migration 7: Add soft_credit_permission field
-- ================================================================

-- Add soft credit permission field to tenants table
ALTER TABLE public.tenants
ADD COLUMN soft_credit_permission boolean DEFAULT false NOT NULL;

-- Add comment to document the field
COMMENT ON COLUMN public.tenants.soft_credit_permission IS 'Whether tenant has given permission for soft credit checks for risk analysis';

-- Update existing tenants to have random soft credit permissions for demo purposes
-- In production, this would be set based on actual tenant permissions
UPDATE public.tenants
SET soft_credit_permission = (random() > 0.4)
WHERE soft_credit_permission IS NULL;
