#!/usr/bin/env node

/**
 * Setup Script for AI-Powered Search Assistant
 * Helps configure the project quickly
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n🚀 AI-Powered Search Assistant - Setup\n');
  console.log('This wizard will help you configure your environment.\n');

  const envPath = path.join(__dirname, '..', '.env.local');
  
  // Check if .env.local exists
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found!');
    process.exit(1);
  }

  // Read current .env.local
  let envContent = fs.readFileSync(envPath, 'utf8');

  console.log('📝 Step 1: Gemini API Key');
  console.log('Get your API key from: https://aistudio.google.com/app/apikey\n');
  
  const geminiKey = await question('Enter your Gemini API Key (or press Enter to skip): ');
  
  if (geminiKey.trim()) {
    // Replace or add GEMINI_API_KEY
    if (envContent.includes('GEMINI_API_KEY=')) {
      envContent = envContent.replace(
        /GEMINI_API_KEY=.*/,
        `GEMINI_API_KEY=${geminiKey.trim()}`
      );
    } else {
      envContent += `\nGEMINI_API_KEY=${geminiKey.trim()}\n`;
    }
    console.log('✅ Gemini API Key configured!\n');
  } else {
    console.log('⏭️  Skipping Gemini API Key (you can add it later)\n');
  }

  // Save updated .env.local
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Setup complete!\n');
  console.log('Next steps:');
  console.log('  1. Run: npm run ingest-data  (to load sample documents)');
  console.log('  2. Run: npm run dev          (to start the app)');
  console.log('  3. Open: http://localhost:3000\n');

  rl.close();
}

setup().catch(error => {
  console.error('❌ Setup failed:', error);
  rl.close();
  process.exit(1);
});
