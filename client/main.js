import P2PCall from "./p2p-call"

async function GetLocalVideo() {
	try {
		const constraints = {audio: true, video: true};
		const stream = await navigator.mediaDevices.getUserMedia(constraints);

		let video = document.createElement("video")
		video.playsinline = true
		video.autoplay = true
		video.muted = true  
		document.querySelector(".videos_container").append(video)
		video.srcObject = stream;

		return stream

	} catch (err) {
		console.error(err);
	}
}

window.addEventListener("DOMContentLoaded", async ()=>{

	// Il server invia il messaggio OnClientConnected a tutti i client della stanza appena un nuovo client si connette
	// Il client Appena riceve il OnNewClient crea il peer_connection dedicato
	// Il peer_connection dedicato crea la offer e la invia e poi invia i candidates
	// Quando riceve la answer dal client_id_xxx setta la answer 
	// Quando riceve i candidates dal client_id_xxx setta il candidate
	
	// Il server invia il messaggio OnClientDisconnected a tutti i client della stanza appena un nuovo client chiude la connessione
	// Questo ultimo messaggio potrebbe anche essere bypassato e gestito lato peer


	//await SignalingClient.Connect("wss://ivpcode-turbo-adventure-vr974vpvjr5cpr7w-8080.preview.app.github.dev/")

	let ls = await GetLocalVideo()
	
	P2PCall.SetLocalStream(ls)
})

  let makingOffer = false;
  let ignoreOffer = false;
  let isSettingRemoteAnswerPending = false;
/*
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
*/