-- Create public storage bucket for forge image/audio uploads
-- Images are uploaded directly from the client (bypasses Vercel serverless limit)
INSERT INTO storage.buckets (id, name, public)
VALUES ('forge-uploads', 'forge-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read files (public bucket, muapi needs to fetch)
CREATE POLICY "forge_uploads_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'forge-uploads');

-- Allow authenticated and anon uploads via signed URLs
CREATE POLICY "forge_uploads_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'forge-uploads');
