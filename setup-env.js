const fs = require('fs');
const crypto = require('crypto');

// Generate a secure random secret
const authSecret = crypto.randomBytes(32).toString('hex');

const envContent = `# Supabase Database URL
# Replace with your actual Supabase database URL
# Format: postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# NextAuth Secret (Generated automatically)
AUTH_SECRET="${authSecret}"
`;

console.log('Creating .env.local file...');
console.log('Generated AUTH_SECRET:', authSecret);
console.log('\nIMPORTANT: You need to update the DATABASE_URL with your actual Supabase connection string!');
console.log('Go to your Supabase dashboard → Settings → Database → Connection string');

try {
  fs.writeFileSync('.env.local', envContent);
  console.log('\n✅ .env.local file created successfully!');
  console.log('Please update the DATABASE_URL with your actual Supabase connection string.');
} catch (error) {
  console.error('Error creating .env.local file:', error.message);
  console.log('\nPlease create a .env.local file manually with the following content:');
  console.log(envContent);
} 