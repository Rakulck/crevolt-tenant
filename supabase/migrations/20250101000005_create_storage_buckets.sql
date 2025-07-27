-- ================================================================
-- Tenant Default Analysis Platform - Database Schema
-- Migration 5: Storage Buckets and Policies
-- ================================================================

-- ================================================================
-- Create Storage Buckets
-- ================================================================

-- Bucket for rent roll documents and related files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rent-rolls',
  'rent-rolls',
  false, -- Private bucket
  26214400, -- 25MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
    'application/vnd.ms-excel', -- .xls
    'text/csv',
    'application/vnd.apple.numbers' -- Apple Numbers
  ]
);

-- Bucket for user profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  false, -- Private bucket with signed URLs
  542800, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
);

-- Bucket for property images and documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-documents',
  'property-documents',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
);

-- Bucket for lease agreements and tenant documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lease-documents',
  'lease-documents',
  false, -- Private bucket for security
  15728640, -- 15MB limit for lease documents
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
);

-- Bucket for generated reports and exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false, -- Private bucket
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain'
  ]
);

-- ================================================================
-- Helper Functions for Storage
-- ================================================================

-- Function to get signed URL for private files
CREATE OR REPLACE FUNCTION public.get_signed_file_url(
  bucket_name text,
  file_path text,
  expires_in_seconds integer DEFAULT 3600
)
RETURNS text AS $$
DECLARE
  signed_url text;
BEGIN
  -- This is implemented in the application code using Supabase client
  -- Each bucket requires signed URLs for access
  RETURN format('placeholder_signed_url_for_%s/%s', bucket_name, file_path);
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique file names with timestamp
CREATE OR REPLACE FUNCTION public.generate_storage_filename(
  user_uuid uuid,
  original_filename text,
  file_type text DEFAULT 'rent_roll'
)
RETURNS text AS $$
DECLARE
  timestamp_str text;
  random_str text;
  file_extension text;
  clean_filename text;
BEGIN
  -- Extract file extension
  file_extension := lower(substring(original_filename from '\.([^.]*)$'));

  -- Generate timestamp string
  timestamp_str := to_char(now(), 'YYYY-MM-DD_HH24-MI-SS');

  -- Generate random string
  random_str := substr(gen_random_uuid()::text, 1, 8);

  -- Clean original filename (remove extension and special characters)
  clean_filename := regexp_replace(
    substring(original_filename from '^(.+)\.[^.]*$'),
    '[^a-zA-Z0-9_-]',
    '_',
    'g'
  );

  -- Construct the storage path with user_id for RLS
  RETURN format(
    '%s/%s/%s_%s_%s.%s',
    user_uuid::text,
    file_type,
    clean_filename,
    timestamp_str,
    random_str,
    file_extension
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Storage Policies
-- ================================================================

-- Note: All buckets are private and require signed URLs for access
-- RLS policies ensure users can only access their own files

-- Common policy for all buckets: Users can only access their own files
CREATE POLICY "Users can access own files" ON storage.objects
  FOR ALL USING (
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Specific upload policies for each bucket with file type validation

-- Rent Rolls
CREATE POLICY "Users can upload rent rolls" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rent-rolls' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (lower(right(name, 4)) IN ('.pdf', '.xls', '.csv') OR
     lower(right(name, 5)) IN ('.xlsx'))
  );

-- Profile Images
CREATE POLICY "Users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (lower(right(name, 4)) IN ('.jpg', '.png', '.gif') OR
     lower(right(name, 5)) IN ('.jpeg', '.webp'))
  );

-- Property Documents
CREATE POLICY "Users can upload property documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (lower(right(name, 4)) IN ('.pdf', '.doc', '.jpg', '.png') OR
     lower(right(name, 5)) IN ('.docx', '.xlsx', '.jpeg', '.webp'))
  );

-- Reports
CREATE POLICY "Users can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    (lower(right(name, 4)) IN ('.pdf', '.csv', '.json', '.txt') OR
     lower(right(name, 5)) IN ('.xlsx'))
  );

-- ================================================================
-- Cleanup and Monitoring
-- ================================================================

-- Function to clean up old files
CREATE OR REPLACE FUNCTION public.cleanup_old_files(days_old integer DEFAULT 90)
RETURNS integer AS $$
DECLARE
  deleted_count integer := 0;
BEGIN
  -- Mark old uploaded files as archived
  UPDATE public.uploaded_files
  SET
    is_archived = true,
    archive_date = now()
  WHERE
    created_at < (now() - (days_old || ' days')::interval) AND
    is_archived = false AND
    file_status = 'processed';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION public.get_user_storage_usage(user_uuid uuid)
RETURNS TABLE (
  bucket_name text,
  file_count bigint,
  total_size_bytes bigint,
  total_size_mb decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    uf.storage_bucket::text,
    COUNT(*)::bigint,
    SUM(uf.file_size_bytes)::bigint,
    ROUND((SUM(uf.file_size_bytes) / 1024.0 / 1024.0)::decimal, 2)
  FROM public.uploaded_files uf
  WHERE uf.user_id = user_uuid AND uf.is_archived = false
  GROUP BY uf.storage_bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- Comments for Documentation
-- ================================================================

COMMENT ON FUNCTION public.get_signed_file_url(text, text, integer) IS
  'Generates signed URLs for secure file access - all buckets are private';

COMMENT ON FUNCTION public.generate_storage_filename(uuid, text, text) IS
  'Generates secure filenames with user isolation for storage';

COMMENT ON FUNCTION public.cleanup_old_files(integer) IS
  'Archives old uploaded files after specified days';

COMMENT ON FUNCTION public.get_user_storage_usage(uuid) IS
  'Returns storage usage statistics for a specific user';

-- ================================================================
-- Initial Setup Complete
-- ================================================================

-- Log completion of storage setup
INSERT INTO public.notifications (
  id,
  user_id,
  notification_type,
  title,
  message,
  priority,
  created_at
)
SELECT
  gen_random_uuid(),
  id,
  'system_update',
  'Storage System Initialized',
  'File storage buckets have been created and configured for your account.',
  'low',
  now()
FROM public.user_profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE created_at > now() - interval '1 hour'
);
