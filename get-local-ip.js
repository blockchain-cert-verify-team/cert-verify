#!/usr/bin/env node

/**
 * Get local IP address for mobile access
 */

import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`Your local IP: ${localIP}`);
console.log(`Backend URL: http://${localIP}:4000`);
console.log(`Frontend URL: http://${localIP}:3000`);
console.log(`\nSet this environment variable:`);
console.log(`APP_BASE_URL=http://${localIP}:4000`);


