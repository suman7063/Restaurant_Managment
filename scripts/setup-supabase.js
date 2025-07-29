#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🍕 Restaurant Management System - Supabase Setup');
console.log('================================================\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env.local file already exists');
} else {
  console.log('📝 Creating .env.local file...');
  
  const envContent = `# Supabase Configuration
# Get these values from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
`;
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env.local file created');
}

console.log('\n📋 Next Steps:');
console.log('1. Go to https://supabase.com and create a new project');
console.log('2. Copy your Project URL and Anon Key from Settings → API');
console.log('3. Update the values in .env.local file');
console.log('4. Run the SQL schema from supabase/schema.sql in your Supabase SQL Editor');
console.log('5. Start your development server with: npm run dev');
console.log('\n📖 For detailed instructions, see SUPABASE_SETUP.md');

console.log('\n🔑 Test QR Codes (after running the schema):');
console.log('- QR001 - John Doe (Customer at Table 5)');
console.log('- QR002 - Jane Smith (Customer at Table 3)');
console.log('- QR003 - Bob Wilson (Customer at Table 7)');
console.log('- ADMIN001 - Mike Admin (Admin)');
console.log('- WAITER001 - Sarah Waiter (Waiter)');
console.log('- CHEF001 - Gordon Chef (Chef)');

console.log('\n�� Happy coding!'); 