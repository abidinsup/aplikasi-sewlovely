-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'payment-proofs');

-- 3. Allow anyone to upload files (for simplicity in this flow, or restrict to authenticated if needed)
CREATE POLICY "Public Upload Access" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'payment-proofs');

-- 4. Allow public update (if needed)
CREATE POLICY "Public Update Access" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'payment-proofs');
