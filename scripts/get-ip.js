const os = require('os');

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return null;
}

const ipAddress = getLocalIPAddress();

if (ipAddress) {
  console.log('\n🌐 Your computer\'s IP address is:', ipAddress);
  console.log('📡 Backend server should be accessible at:', `http://${ipAddress}:4000`);
  console.log('\n📝 Update your config/api.js file with this IP address:');
  console.log(`   BASE_URL: 'http://${ipAddress}:4000'`);
  console.log('\n🔧 Make sure your backend server is running on port 4000');
  console.log('📱 Ensure your mobile device is on the same network as this computer\n');
} else {
  console.log('❌ Could not determine your IP address');
  console.log('🔧 Please check your network connection\n');
}
