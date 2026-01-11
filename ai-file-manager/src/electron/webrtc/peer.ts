import { sendLanSignal } from "./presence.js";


let pc: RTCPeerConnection | null = null;
let dataChannel: RTCDataChannel | null = null;
let currentPeerId: string | null = null;

export function createPeer(peerId: string) {
  currentPeerId = peerId;

  pc = new RTCPeerConnection({
    iceServers: [], // LAN only for now
  });

  pc.onicecandidate = (e) => {
    if (e.candidate && currentPeerId) {
      sendLanSignal(currentPeerId, {
        type: "ice",
        candidate: e.candidate,
      });
    }
  };

  dataChannel = pc.createDataChannel("data");

  dataChannel.onopen = () => {
    console.log("WebRTC data channel open");
  };

  dataChannel.onmessage = (e) => {
    console.log("Received:", e.data);
  };

  return pc;
}

export function getDataChannel() {
  return dataChannel;
}
