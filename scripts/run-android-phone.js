#!/usr/bin/env node
/**
 * Start Pixel_7_Pro_API_34 (phone) if needed, then run the app on that device.
 * React Native --device expects adb id (emulator-5554), not the AVD name.
 */
const { execSync, spawnSync, spawn } = require('child_process');

const PHONE_AVD = 'Pixel_7_Pro_API_34';

function exec(cmd, options = {}) {
  return execSync(cmd, { encoding: 'utf8', ...options });
}

function getConnectedDevices() {
  try {
    const output = exec('adb devices', { stdio: ['pipe', 'pipe', 'pipe'] });
    return output
      .split('\n')
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter(([id, state]) => id && state === 'device')
      .map(([id]) => id);
  } catch {
    return [];
  }
}

function getAvdName(deviceId) {
  try {
    const name = exec(`adb -s ${deviceId} emu avd name`, { stdio: ['pipe', 'pipe', 'pipe'] });
    return name.trim().split('\n')[0];
  } catch {
    return null;
  }
}

function sleep(seconds) {
  execSync(`sleep ${seconds}`);
}

function waitForBoot(deviceId, timeoutSeconds = 180) {
  for (let i = 0; i < timeoutSeconds; i += 1) {
    try {
      const booted = exec(`adb -s ${deviceId} shell getprop sys.boot_completed`, {
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      if (booted === '1') {
        return true;
      }
    } catch {
      // emulator still starting
    }
    sleep(1);
  }
  return false;
}

function startPhoneEmulator() {
  console.log(`Starting phone emulator: ${PHONE_AVD}`);
  spawn('emulator', ['-avd', PHONE_AVD], {
    detached: true,
    stdio: 'ignore',
  }).unref();

  exec('adb wait-for-device');
  const deviceId = getConnectedDevices()[0];
  if (!deviceId) {
    console.error('Emulator did not appear in adb devices.');
    process.exit(1);
  }

  console.log('Waiting for emulator to finish booting...');
  if (!waitForBoot(deviceId)) {
    console.error('Timed out waiting for emulator to boot.');
    process.exit(1);
  }

  return deviceId;
}

const devices = getConnectedDevices();
let deviceId = devices.find((id) => getAvdName(id) === PHONE_AVD);

if (!deviceId) {
  if (devices.length > 0) {
    const runningAvd = getAvdName(devices[0]) || 'unknown';
    console.error(
      `A different emulator is already running (${runningAvd} on ${devices[0]}).`,
    );
    console.error(`Close it first, then run: npm run android`);
    console.error(`Or pick a device manually: npm run android:pick`);
    process.exit(1);
  }
  deviceId = startPhoneEmulator();
}

console.log(`Installing on ${deviceId} (${PHONE_AVD})`);

const result = spawnSync(
  'npx',
  ['react-native', 'run-android', '--device', deviceId],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

process.exit(result.status ?? 1);
