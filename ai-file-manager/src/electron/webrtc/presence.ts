import dgram from "dgram";
import crypto from "crypto";
import { log } from "../logger.js";

const PORT = 41234;
const BROADCAST_ADDR = "255.255.255.255";
const HEARTBEAT_INTERVAL = 2000;
const OFFLINE_TIMEOUT = 6000;

const socket = dgram.createSocket("udp4");

// ──────────────────────────────
// Identity
// ──────────────────────────────
export const DEVICE_ID = crypto.randomUUID();
const START_TIME = Date.now();

// ──────────────────────────────
// Host state (mutable, safe)
// ──────────────────────────────
let IS_HOST = false;
const SIGNAL_PORT = 9000;
const SIGNAL_PATH = "/peerjs";

// ──────────────────────────────
// Types
// ──────────────────────────────
export type DeviceInfo = {
  deviceId: string;
  address: string;
  role: "host" | "client";
  uptime: number;
  lastSeen: number;
  signalPort?: number;
  signalPath?: string;
};

const devices = new Map<string, DeviceInfo>();

// ──────────────────────────────
// Utils
// ──────────────────────────────
function getUptimeSeconds() {
  return Math.floor((Date.now() - START_TIME) / 1000);
}

// ──────────────────────────────
// Presence Broadcast
// ──────────────────────────────
function broadcastPresence() {
  const message = JSON.stringify({
    type: "presence",
    deviceId: DEVICE_ID,
    role: IS_HOST ? "host" : "client",
    uptime: getUptimeSeconds(),
    timestamp: Date.now(),
    signal: IS_HOST
      ? { port: SIGNAL_PORT, path: SIGNAL_PATH }
      : null,
  });

  socket.send(message, PORT, BROADCAST_ADDR);
}

// ──────────────────────────────
// Message Listener
// ──────────────────────────────
socket.on("message", (msg, rinfo) => {
  try {
    const data = JSON.parse(msg.toString());
    if (data.deviceId === DEVICE_ID) return;

    if (data.type === "presence") {
      devices.set(data.deviceId, {
        deviceId: data.deviceId,
        address: rinfo.address,
        role: data.role,
        uptime: data.uptime,
        lastSeen: Date.now(),
        signalPort: data.signal?.port,
        signalPath: data.signal?.path,
      });
    }

    if (data.type === "signal" && data.to === DEVICE_ID) {
      handleSignal(data.from, data.payload);
    }
  } catch {
    /* ignore malformed packets */
  }
});

// ──────────────────────────────
// Cleanup Offline Devices
// ──────────────────────────────
function cleanupDevices() {
  const now = Date.now();
  for (const [id, info] of devices.entries()) {
    if (now - info.lastSeen > OFFLINE_TIMEOUT) {
      devices.delete(id);
    }
  }
}

// ──────────────────────────────
// Public API
// ──────────────────────────────

// 🚀 START ONCE
export function startLanPresence() {
  socket.bind(PORT, () => {
    socket.setBroadcast(true);
    setInterval(broadcastPresence, HEARTBEAT_INTERVAL);
    setInterval(cleanupDevices, HEARTBEAT_INTERVAL);
  });
}

//  SAFE ROLE CHANGE
export function setHostRole(isHost: boolean) {
  if (IS_HOST !== isHost) {
    IS_HOST = isHost;
    log("info", `Presence role changed → ${IS_HOST ? "HOST" : "CLIENT"}`);
  }
}

export function getLanDevices(): DeviceInfo[] {
  return Array.from(devices.values());
}

// ──────────────────────────────
// Optional: Unicast signaling
// ──────────────────────────────
export function sendLanSignal(
  targetDeviceId: string,
  payload: any
) {
  const target = devices.get(targetDeviceId);
  if (!target) return;

  const message = JSON.stringify({
    type: "signal",
    from: DEVICE_ID,
    to: targetDeviceId,
    payload,
  });

  socket.send(message, PORT, target.address);
}

function handleSignal(from: string, payload: any) {
  log("debug", `Signal from ${from}: ${JSON.stringify(payload)}`);
}
