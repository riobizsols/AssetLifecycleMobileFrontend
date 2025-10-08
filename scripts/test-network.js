#!/usr/bin/env node

/**
 * Network Diagnostic Tool
 * Tests connectivity to the backend server
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Running Network Diagnostics...\n');

// 1. Get current IP address
console.log('1️⃣  Checking your computer IP address...');
try {
  const ip = execSync("ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -1")
    .toString()
    .trim();
  console.log(`   ✅ Your IP: ${ip}\n`);
} catch (error) {
  console.log('   ⚠️  Could not detect IP address\n');
}

// 2. Read current API config
console.log('2️⃣  Checking API configuration...');
try {
  const apiConfigPath = path.join(__dirname, '../config/api.js');
  const apiConfig = fs.readFileSync(apiConfigPath, 'utf8');
  const baseUrlMatch = apiConfig.match(/BASE_URL:\s*['"]([^'"]+)['"]/);
  
  if (baseUrlMatch) {
    console.log(`   📝 Configured server: ${baseUrlMatch[1]}\n`);
  }
} catch (error) {
  console.log('   ⚠️  Could not read API config\n');
}

// 3. Check if port 4000 is listening
console.log('3️⃣  Checking if server is running on port 4000...');
try {
  const result = execSync('lsof -i :4000 | grep LISTEN')
    .toString()
    .trim();
  
  if (result) {
    console.log('   ✅ Server is running on port 4000\n');
  }
} catch (error) {
  console.log('   ❌ No server found on port 4000');
  console.log('   💡 Start your backend server first!\n');
}

// 4. Test server connectivity
console.log('4️⃣  Testing server connectivity...');
try {
  const apiConfigPath = path.join(__dirname, '../config/api.js');
  const apiConfig = fs.readFileSync(apiConfigPath, 'utf8');
  const baseUrlMatch = apiConfig.match(/BASE_URL:\s*['"]([^'"]+)['"]/);
  
  if (baseUrlMatch) {
    const serverUrl = baseUrlMatch[1];
    const result = execSync(`curl -s -o /dev/null -w "%{http_code}" ${serverUrl}/api/health`)
      .toString()
      .trim();
    
    if (result === '200' || result === '401' || result === '404') {
      console.log(`   ✅ Server is reachable (HTTP ${result})\n`);
    } else {
      console.log(`   ⚠️  Server returned unexpected code: ${result}\n`);
    }
  }
} catch (error) {
  console.log('   ❌ Server is not reachable');
  console.log('   💡 Check if server is running and firewall settings\n');
}

// 5. Check connected Android devices
console.log('5️⃣  Checking connected Android devices...');
try {
  const result = execSync('adb devices')
    .toString()
    .split('\n')
    .filter(line => line.includes('device') && !line.includes('List of devices'))
    .map(line => line.split('\t')[0]);
  
  if (result.length > 0) {
    console.log('   ✅ Connected devices:');
    result.forEach(device => console.log(`      - ${device}`));
    console.log('');
  } else {
    console.log('   ⚠️  No Android devices connected\n');
  }
} catch (error) {
  console.log('   ⚠️  Could not check devices (adb not found?)\n');
}

// 6. Check firewall status (macOS)
console.log('6️⃣  Checking macOS firewall...');
try {
  const result = execSync('/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate')
    .toString()
    .trim();
  
  if (result.includes('disabled') || result.includes('State = 0')) {
    console.log('   ✅ Firewall is disabled (connections allowed)\n');
  } else {
    console.log('   ⚠️  Firewall is enabled (might block connections)\n');
  }
} catch (error) {
  console.log('   ⚠️  Could not check firewall status\n');
}

console.log('═══════════════════════════════════════');
console.log('✅ Diagnostics complete!');
console.log('═══════════════════════════════════════\n');

console.log('📋 Quick Fix Checklist:');
console.log('   [ ] Server is running on port 4000');
console.log('   [ ] Phone/emulator is connected');
console.log('   [ ] Phone is on same WiFi network');
console.log('   [ ] API config has correct IP address');
console.log('   [ ] App has been rebuilt after config changes\n');

