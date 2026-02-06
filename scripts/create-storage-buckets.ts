import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
});

async function createBucket(name: string, isPublic: boolean = true) {
    console.log(`Creating bucket: ${name}...`);

    const { data, error } = await supabase.storage.createBucket(name, {
        public: isPublic,
        fileSizeLimit: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log(`✓ Bucket "${name}" already exists`);
            return true;
        }
        console.error(`✗ Failed to create bucket "${name}":`, error.message);
        return false;
    }

    console.log(`✓ Created bucket: ${name}`);
    return true;
}

async function main() {
    console.log('Setting up Supabase storage buckets...\n');

    const bucketsToCreate = [
        { name: 'avatars', public: true },
        { name: 'course-images', public: true },
    ];

    for (const bucket of bucketsToCreate) {
        await createBucket(bucket.name, bucket.public);
    }

    console.log('\nDone!');
}

main().catch(console.error);
