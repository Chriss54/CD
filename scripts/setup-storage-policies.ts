import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function setupStoragePolicies() {
    console.log('Setting up storage RLS policies...\n');

    // SQL to create policies for course-images bucket
    // Allows authenticated users to upload and public to read
    const policies = [
        // Public read access for course-images
        `
    CREATE POLICY IF NOT EXISTS "Public read access for course-images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'course-images');
    `,
        // Authenticated users can upload to course-images
        `
    CREATE POLICY IF NOT EXISTS "Authenticated users can upload course images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'course-images' AND auth.role() = 'authenticated');
    `,
        // Authenticated users can update their uploads
        `
    CREATE POLICY IF NOT EXISTS "Authenticated users can update course images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');
    `,
        // Authenticated users can delete their uploads
        `
    CREATE POLICY IF NOT EXISTS "Authenticated users can delete course images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');
    `,
    ];

    for (const policy of policies) {
        const { error } = await supabase.rpc('exec_sql', { sql: policy });
        if (error) {
            // Try direct approach if rpc doesn't work
            console.log('Note: Direct SQL execution not available via SDK.');
            console.log('Please run the following SQL in Supabase SQL Editor:\n');
            console.log(`
-- Allow public read access to course-images bucket
CREATE POLICY "Public read access for course-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

-- Allow authenticated users to upload to course-images
CREATE POLICY "Authenticated users can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update course images
CREATE POLICY "Authenticated users can update course images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete course images
CREATE POLICY "Authenticated users can delete course images"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-images' AND auth.role() = 'authenticated');
      `);
            break;
        }
    }
}

setupStoragePolicies().catch(console.error);
