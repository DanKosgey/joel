const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function run() {
  console.log('Checking storage bucket status...');
  try {
    const { data: buckets, error: getError } = await supabaseAdmin.storage.listBuckets();
    if (getError) {
      console.error('Error listing buckets:', getError.message);
      process.exit(1);
    }
    
    const exists = buckets.find(b => b.id === 'kyc-documents');
    if (exists) {
      console.log('✅ kyc-documents bucket already exists.');
      process.exit(0);
    }
    
    console.log('Creating private kyc-documents bucket...');
    const { data, error } = await supabaseAdmin.storage.createBucket('kyc-documents', {
      public: false,
      fileLimitSizeInBytes: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf']
    });
    
    if (error) {
      console.error('❌ Error creating bucket:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Bucket created successfully:', data);
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err.message);
    process.exit(1);
  }
}

run();
