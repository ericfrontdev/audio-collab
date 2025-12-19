/**
 * Script to create the project-audio storage bucket in Supabase
 * Run with: npx tsx scripts/create-audio-bucket.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SECRET_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createAudioBucket() {
  console.log('Checking for project-audio bucket...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }

  const existingBucket = buckets?.find((b) => b.id === 'project-audio');

  if (existingBucket) {
    console.log('✅ project-audio bucket already exists');
    console.log('Bucket details:', existingBucket);
    return;
  }

  console.log('Creating project-audio bucket...');

  const { data, error } = await supabase.storage.createBucket('project-audio', {
    public: true,
    fileSizeLimit: 104857600, // 100MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/flac',
      'audio/x-flac',
      'audio/mp4',
      'audio/m4a',
      'audio/ogg',
    ],
  });

  if (error) {
    console.error('❌ Error creating bucket:', error);
    process.exit(1);
  }

  console.log('✅ project-audio bucket created successfully!');
  console.log('Bucket data:', data);
}

createAudioBucket()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
