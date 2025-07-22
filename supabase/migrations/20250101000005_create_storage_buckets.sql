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
  true, -- Public bucket for profile images
  2097152, -- 2MB limit
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
-- Storage Policies for Rent Roll Documents
-- ================================================================

-- Allow users to upload rent roll documents
CREATE POLICY "Users can upload rent rolls" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rent-rolls' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    -- Check file extension is allowed
    lower(right(name, 4)) IN ('.pdf', '.xls', '.csv') OR
    lower(right(name, 5)) IN ('.xlsx')
  );

-- Allow users to view their own rent roll documents
CREATE POLICY "Users can view own rent rolls" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'rent-rolls' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own rent roll documents
CREATE POLICY "Users can update own rent rolls" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'rent-rolls' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own rent roll documents
CREATE POLICY "Users can delete own rent rolls" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'rent-rolls' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- Storage Policies for Profile Images
-- ================================================================

-- Allow users to upload their profile images
CREATE POLICY "Users can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1] AND
    -- Check file extension is allowed
    lower(right(name, 4)) IN ('.jpg', '.png', '.gif') OR
    lower(right(name, 5)) IN ('.jpeg', '.webp')
  );

-- Allow users to view their own profile images
CREATE POLICY "Users can view own profile images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their profile images
CREATE POLICY "Users can update own profile images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their profile images
CREATE POLICY "Users can delete own profile images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- Storage Policies for Property Documents
-- ================================================================

-- Allow users to upload property documents
CREATE POLICY "Users can upload property documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own property documents
CREATE POLICY "Users can view own property documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their property documents
CREATE POLICY "Users can update own property documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their property documents
CREATE POLICY "Users can delete own property documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- Storage Policies for Reports
-- ================================================================

-- Allow users to upload generated reports
CREATE POLICY "Users can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own reports
CREATE POLICY "Users can view own reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their reports
CREATE POLICY "Users can delete own reports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'reports' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ================================================================
-- Helper Functions for Storage
-- ================================================================

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
  
  -- Construct the storage path
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
  -- This would be implemented in your application code
  -- as Supabase storage signing requires the service key
  RETURN format('placeholder_signed_url_for_%s/%s', bucket_name, file_path);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old files
CREATE OR REPLACE FUNCTION public.cleanup_old_files(
  days_old integer DEFAULT 90
)
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

-- ================================================================
-- Automatic File Cleanup Triggers
-- ================================================================

-- Function to update file record when storage object is deleted
CREATE OR REPLACE FUNCTION public.handle_storage_delete()
RETURNS trigger AS $$
BEGIN
  -- Update the uploaded_files table when a storage object is deleted
  UPDATE public.uploaded_files 
  SET 
    file_status = 'archived',
    archive_date = now()
  WHERE storage_path = OLD.name;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would need to be created on the storage.objects table
-- which may require additional permissions and setup

-- ================================================================
-- Storage Statistics and Monitoring
-- ================================================================

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

COMMENT ON FUNCTION public.generate_storage_filename(uuid, text, text) IS 
  'Generates unique storage file names with timestamp and random components';

COMMENT ON FUNCTION public.cleanup_old_files(integer) IS 
  'Archives old uploaded files older than specified days';

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