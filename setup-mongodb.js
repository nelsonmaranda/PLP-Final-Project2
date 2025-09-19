#!/usr/bin/env node

/**
 * MongoDB Atlas Setup Script for Smart Matatu
 * This script helps you configure MongoDB Atlas with Firebase Functions
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupMongoDB() {
  console.log('🗄️  MongoDB Atlas Setup for Smart Matatu\n');
  
  console.log('This script will help you configure MongoDB Atlas with your Firebase Functions.\n');
  
  // Get MongoDB connection string
  const mongoURI = await question('Enter your MongoDB Atlas connection string: ');
  
  if (!mongoURI || !mongoURI.includes('mongodb+srv://')) {
    console.log('❌ Invalid MongoDB URI. Please provide a valid connection string.');
    process.exit(1);
  }
  
  console.log('\n🔧 Setting up Firebase Functions configuration...\n');
  
  try {
    // Set Firebase config
    const configCommand = `firebase functions:config:set mongodb.uri="${mongoURI}"`;
    console.log(`Running: ${configCommand}`);
    execSync(configCommand, { stdio: 'inherit' });
    
    console.log('\n✅ MongoDB URI configured successfully!');
    
    // Ask if user wants to deploy
    const deploy = await question('\n🚀 Deploy the updated functions now? (y/n): ');
    
    if (deploy.toLowerCase() === 'y' || deploy.toLowerCase() === 'yes') {
      console.log('\n📦 Deploying Firebase Functions...\n');
      execSync('firebase deploy --only functions', { stdio: 'inherit' });
      console.log('\n✅ Functions deployed successfully!');
    } else {
      console.log('\n📝 To deploy later, run: firebase deploy --only functions');
    }
    
    console.log('\n🎉 MongoDB Atlas setup complete!');
    console.log('\n📊 Next steps:');
    console.log('1. Check your Firebase Functions logs: firebase functions:log');
    console.log('2. Test your API endpoints');
    console.log('3. Verify data is being stored in MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ Error setting up MongoDB:', error.message);
    console.log('\n🔧 Manual setup:');
    console.log('1. Run: firebase functions:config:set mongodb.uri="YOUR_URI"');
    console.log('2. Run: firebase deploy --only functions');
  }
  
  rl.close();
}

// Run the setup
setupMongoDB().catch(console.error);
