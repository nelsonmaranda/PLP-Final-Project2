#!/usr/bin/env node

/**
 * Security Check Script for Smart Matatu
 * 
 * This script scans the codebase for potential security issues
 * and ensures no sensitive credentials are exposed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Security patterns to check for
const securityPatterns = [
  {
    name: 'MongoDB Connection Strings',
    pattern: /mongodb\+srv:\/\/[^:]+:[^@]+@/g,
    severity: 'CRITICAL',
    message: 'Hardcoded MongoDB credentials found',
    excludeFiles: [/\.md$/, /\.txt$/, /SECURITY_BEST_PRACTICES/]
  },
  {
    name: 'JWT Secrets',
    pattern: /JWT_SECRET\s*=\s*['"][^'"]+['"]/g,
    severity: 'HIGH',
    message: 'Hardcoded JWT secret found',
    excludeFiles: [/test/, /\.md$/, /\.txt$/]
  },
  {
    name: 'API Keys',
    pattern: /(api[_-]?key|secret[_-]?key)\s*=\s*['"][^'"]+['"]/gi,
    severity: 'HIGH',
    message: 'Hardcoded API key found',
    excludeFiles: [/\.md$/, /\.txt$/]
  },
  {
    name: 'Passwords',
    pattern: /password\s*=\s*['"][^'"]{8,}['"]/gi,
    severity: 'HIGH',
    message: 'Hardcoded password found',
    excludeFiles: [/test/, /\.md$/, /\.txt$/, /validation/, /Signup\.tsx/, /Login\.tsx/]
  },
  {
    name: 'Database URLs',
    pattern: /(mysql|postgresql|mongodb):\/\/[^:]+:[^@]+@/gi,
    severity: 'CRITICAL',
    message: 'Hardcoded database credentials found',
    excludeFiles: [/\.md$/, /\.txt$/]
  }
];

// Files to exclude from scanning
const excludePatterns = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.env/,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.map$/,
  /SECURITY_BEST_PRACTICES\.md/,
  /security-check\.js/
];

// Directories to scan
const scanDirectories = [
  'backend',
  'frontend/src',
  'docs'
];

let issuesFound = 0;
let filesScanned = 0;

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    filesScanned++;
    
    securityPatterns.forEach(pattern => {
      // Check if file should be excluded for this pattern
      const shouldExclude = pattern.excludeFiles && pattern.excludeFiles.some(excludePattern => 
        excludePattern.test(filePath)
      );
      
      if (shouldExclude) {
        return;
      }
      
      const matches = content.match(pattern.pattern);
      if (matches) {
        issuesFound++;
        log('red', `❌ ${pattern.severity}: ${pattern.message}`);
        log('red', `   File: ${filePath}`);
        matches.forEach(match => {
          // Mask sensitive parts
          const masked = match.replace(/([^:]+):([^@]+)@/, '$1:***@');
          log('red', `   Found: ${masked}`);
        });
        console.log();
      }
    });
  } catch (error) {
    log('yellow', `⚠️  Could not read file: ${filePath}`);
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      // Check if file should be excluded
      const shouldExclude = excludePatterns.some(pattern => 
        pattern.test(fullPath) || pattern.test(item)
      );
      
      if (shouldExclude) {
        return;
      }
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile()) {
        // Only scan relevant file types
        if (/\.(js|ts|tsx|jsx|json|md)$/.test(item)) {
          scanFile(fullPath);
        }
      }
    });
  } catch (error) {
    log('yellow', `⚠️  Could not scan directory: ${dirPath}`);
  }
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('yellow', '⚠️  You have uncommitted changes. Consider committing security fixes first.');
    }
  } catch (error) {
    log('yellow', '⚠️  Could not check git status');
  }
}

function checkEnvFiles() {
  const envFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'backend/production.env'
  ];
  
  envFiles.forEach(envFile => {
    if (fs.existsSync(envFile)) {
      log('yellow', `⚠️  Found environment file: ${envFile}`);
      log('yellow', '   Make sure it contains only placeholder values, not real credentials');
    }
  });
}

function main() {
  console.log(`${colors.bold}${colors.blue}🔒 Smart Matatu Security Check${colors.reset}\n`);
  
  log('blue', 'Starting security scan...');
  console.log();
  
  // Check git status
  checkGitStatus();
  console.log();
  
  // Check for environment files
  checkEnvFiles();
  console.log();
  
  // Scan directories
  scanDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      log('blue', `Scanning directory: ${dir}`);
      scanDirectory(dir);
    } else {
      log('yellow', `Directory not found: ${dir}`);
    }
  });
  
  console.log();
  console.log('='.repeat(50));
  
  if (issuesFound === 0) {
    log('green', '✅ Security scan completed successfully!');
    log('green', '   No security issues found.');
  } else {
    log('red', `❌ Security scan completed with ${issuesFound} issues found.`);
    log('red', '   Please fix these issues before committing to the repository.');
  }
  
  log('blue', `📊 Files scanned: ${filesScanned}`);
  log('blue', `🚨 Issues found: ${issuesFound}`);
  
  console.log();
  log('blue', 'For more information, see SECURITY_BEST_PRACTICES.md');
  
  // Exit with error code if issues found
  if (issuesFound > 0) {
    process.exit(1);
  }
}

// Run the security check
main();
