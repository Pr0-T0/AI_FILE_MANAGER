import dgram from "dgram";
import os from "os";
import crypto from "crypto";

const PORT = 41234;
const BROADCAST_ADDR = "255.255.255.255";
const HEARTBEAT_INTERVAL = 2000; // ms
const OFFLINE_TIMEOUT = 6000; // ms

const socket = dgram.createSocket("udp4");

// unique ID per app instance
const DEVICE_ID = crypto.randomUUID();
const START_TIME = Date.now();

// store known devices
type DeviceInfo = {
  deviceId: string;
  address: string;
  uptime: number;
  lastSeen: number;
};

const devices = new Map<string, DeviceInfo>();

function getUptimeSeconds() {
  return Math.floor((Date.now() - START_TIME) / 1000);
}

// send heartbeat
function broadcastPresence() {
  const message = JSON.stringify({
    deviceId: DEVICE_ID,
    uptime: getUptimeSeconds(),
    timestamp: Date.now(),
  });

  socket.send(
    message,
    0,
    message.length,
    PORT,
    BROADCAST_ADDR
  );
}

// listen for others
socket.on("message", (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString());

    if (data.deviceId === DEVICE_ID) return;

    devices.set(data.deviceId, {
      deviceId: data.deviceId,
      address: rinfo.address,
      uptime: data.uptime,
      lastSeen: Date.now(),
    });
  } catch {
    // ignore malformed packets
  }
});

// cleanup offline devices
function cleanupDevices() {
  const now = Date.now();
  for (const [id, info] of devices.entries()) {
    if (now - info.lastSeen > OFFLINE_TIMEOUT) {
      devices.delete(id);
    }
  }
}

// print status
function printStatus() {
  console.clear();
  console.log("=== LAN Devices ===");
  console.log(`This device: ${DEVICE_ID}`);
  console.log("");

  if (devices.size === 0) {
    console.log("No other devices detected");
    return;
  }

  for (const info of devices.values()) {
    console.log(
      `ID: ${info.deviceId}
IP: ${info.address}
Uptime: ${info.uptime}s
Last seen: ${(Date.now() - info.lastSeen) / 1000}s ago
---------------------------`
    );
  }
}

// // socket setup
// socket.bind(PORT, () => {
//   socket.setBroadcast(true);

//   setInterval(broadcastPresence, HEARTBEAT_INTERVAL);
//   setInterval(cleanupDevices, HEARTBEAT_INTERVAL);
//   setInterval(printStatus, HEARTBEAT_INTERVAL);
// });

export function startLanPresence() {
    // socket setup
    socket.bind(PORT, () => {
    socket.setBroadcast(true);

    setInterval(broadcastPresence, HEARTBEAT_INTERVAL);
    setInterval(cleanupDevices, HEARTBEAT_INTERVAL);
    setInterval(printStatus, HEARTBEAT_INTERVAL);
    });
}