import SignalingChannel from 'signaling-channel'

const signaling = new SignalingChannel(); // handles JSON.stringify/parse
const constraints = {audio: true, video: true};
const configuration = {iceServers: [{urls: 'stun:stun.example.org'}]};
const pc = new RTCPeerConnection(configuration);

// call start() anytime on either end to add camera and microphone to connection
async function start() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }
    selfView.srcObject = stream;
  } catch (err) {
    console.error(err);
  }
}

pc.ontrack = ({track, streams}) => {
  // once media for a remote track arrives, show it in the remote video element
  track.onunmute = () => {
    // don't set srcObject again if it is already set.
    if (remoteView.srcObject) return;
    remoteView.srcObject = streams[0];
  };
};

// - The perfect negotiation logic, separated from the rest of the application ---

// keep track of some negotiation state to prevent races and errors
let makingOffer = false;
let ignoreOffer = false;
let isSettingRemoteAnswerPending = false;

// send any ice candidates to the other peer
pc.onicecandidate = ({candidate}) => signaling.send({candidate});

// let the "negotiationneeded" event trigger offer generation
pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true;
    await pc.setLocalDescription();
    signaling.send({description: pc.localDescription});
  } catch (err) {
     console.error(err);
  } finally {
    makingOffer = false;
  }
};

signaling.onmessage = async ({data: {description, candidate}}) => {
  try {
    if (description) {
      // An offer may come in while we are busy processing SRD(answer).
      // In this case, we will be in "stable" by the time the offer is processed
      // so it is safe to chain it on our Operations Chain now.
      const readyForOffer =
          !makingOffer &&
          (pc.signalingState == "stable" || isSettingRemoteAnswerPending);
      const offerCollision = description.type == "offer" && !readyForOffer;

      ignoreOffer = !polite && offerCollision;
      if (ignoreOffer) {
        return;
      }
      isSettingRemoteAnswerPending = description.type == "answer";
      await pc.setRemoteDescription(description); // SRD rolls back as needed
      isSettingRemoteAnswerPending = false;
      if (description.type == "offer") {
        await pc.setLocalDescription();
        signaling.send({description: pc.localDescription});
      }
    } else if (candidate) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        if (!ignoreOffer) throw err; // Suppress ignored offer's candidates
      }
    }
  } catch (err) {
    console.error(err);
  }
}