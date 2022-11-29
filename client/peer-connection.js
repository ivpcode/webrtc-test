export default class PeerConnection {

	constructor(RemotePeerId, LocalStream, Signaling, Configuration) {

		if (Configuration == null)
			Configuration = {iceServers: [{urls: 'stun:stun.example.org'}]};

		this.remote_peer_id = RemotePeerId
		this.local_stream = LocalStream
		this.signaling = signaling
		
		this.local_offer = null
		this.local_ice_candidates = []

		this._peer_connection = new RTCPeerConnection(Configuration);
		this._peer_connection.onnegotiationneeded = async ()=> { await this._OnNegotiationNeedded() }
		this._peer_connection.onicecandidate = async ({candidate})=> { await this._OnIceCandidate(candidate) }
		this._peer_connection.ontrack = async ({track, streams})=> { await this._OnTrack(track, streams) }

		for (const track of this.local_stream.getTracks()) {
			this._peer_connection.addTrack(track, this.local_stream);
		}
	}
	
	async _OnNegotiationNeedded() {
		try {
			this.local_offer = await this._peer_connection.createOffer()
			
			console.log("====> OFFER")
			console.log(this.local_offer)
	
			await this._peer_connection.setLocalDescription(this.local_offer);
	
			//await SignalingClient.SendOffer(this._peer_connection.localDescription)
	
		} catch (err) {
			console.error(err);
		} finally {
			
		}
	}

	async _OnIceCandidate(candidate) { 
		//signaling.send({candidate})
		if (candidate == null)
			return

		this.local_ice_candidates.push(candidate)
		console.log("====> CANDIDATE")
		console.log(candidate)
	}

	async _OnTrack(track, streams) {
		// track.onunmute = () => {
		// 	if (remoteView.srcObject) 
		// 		return;
			
		// 	remoteView.srcObject = streams[0];
		// }
	}
	

}