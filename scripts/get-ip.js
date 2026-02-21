const os = require('os');
const { execSync } = require('child_process');

function safeExec(cmd) {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function getIPv4CandidatesFromOs() {
  try {
    const interfaces = os.networkInterfaces();
    const ips = [];

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal && iface.address) {
          ips.push({ name, address: iface.address });
        }
      }
    }

    return ips;
  } catch {
    return [];
  }
}

function getIPv4CandidatesFromShell() {
  const raw =
    safeExec("ipconfig getifaddr en0") ||
    safeExec("ipconfig getifaddr en1") ||
    safeExec("ifconfig | grep 'inet ' | grep -v 127.0.0.1 | awk '{print $2}' | head -n 5");

  const ips = raw
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => /^\d{1,3}(\.\d{1,3}){3}$/.test(s));

  return ips.map((address) => ({ name: 'shell', address }));
}

function isLocalNetIp(ip) {
  return (
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  );
}

function getLocalIPAddress() {
  console.log('=== Network Interfaces ===');

  const candidates = [
    ...getIPv4CandidatesFromOs(),
    ...getIPv4CandidatesFromShell(),
  ];

  const seen = new Set();
  const unique = candidates.filter(({ address }) => {
    if (seen.has(address)) return false;
    seen.add(address);
    return true;
  });

  if (unique.length === 0) {
    console.log('⚠️  Could not detect any IPv4 addresses.');
  }

  for (const { name, address } of unique) {
    console.log(`\n${name}:`);
    console.log(`  IPv4: ${address}`);

    if (isLocalNetIp(address)) {
      console.log(`  ✅ Recommended for Android (physical device): http://${address}:4000`);
    }
  }

  console.log('\n=== Instructions ===');
  console.log('1. Make sure your Android device is on the same WiFi network');
  console.log('2. Update the IP address in config/api.js (DEV_ANDROID_LAN_URL)');
  console.log('3. Reload the app (or rebuild if you changed native files)');
  console.log('4. Test the connection');
}

getLocalIPAddress();