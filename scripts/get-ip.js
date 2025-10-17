const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  console.log('=== Network Interfaces ===');
  
  for (const name of Object.keys(interfaces)) {
    console.log(`\n${name}:`);
    
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  IPv4: ${iface.address}`);
        
        // Check if this looks like a local network IP
        if (iface.address.startsWith('192.168.') || 
            iface.address.startsWith('10.') || 
            iface.address.startsWith('172.')) {
          console.log(`  ✅ Recommended for Android: http://${iface.address}:4000`);
        }
      }
    }
  }
  
  console.log('\n=== Instructions ===');
  console.log('1. Make sure your Android device is on the same WiFi network');
  console.log('2. Update the IP address in config/api.js if needed');
  console.log('3. Restart your React Native app');
  console.log('4. Test the connection');
}

getLocalIPAddress();