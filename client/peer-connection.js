export default class PeerConnection {

	constructor(RemotePeerId, LocalStream, Signaling, Configuration) {

		if (Configuration == null)
			Configuration = {iceServers: [{urls: 'stun:stun.example.org'}]};

		this.remote_peer_id = RemotePeerId
		this.local_stream = LocalStream
		this.signaling = Signaling
		
		this.local_offer = null
		this.local_ice_candidates = []

		this._peer_connection = new RTCPeerConnection(Configuration);
		this._peer_connection.onnegotiationneeded = async ()=> { await this._OnNegotiationNeedded() }
		this._peer_connection.onicecandidate = async ({candidate})=> { await this._OnIceCandidate(candidate) }
		this._peer_connection.ontrack = async ({track, streams})=> { await this._OnTrack(track, streams) }
		this._peer_connection.ondatachannel = async (ev) => {
			this.data_channel = ev.channel;
			this.data_channel.onmessage = (msg) => { console.log("onmessage"); console.log(msg) };
			this.data_channel.onopen = (e) => { console.log("onopen"); console.log(e) };
			this.data_channel.onclose = (e) => { console.log("onclose"); console.log(e) };
		}

	}
	
	async StartConnectionNegotiation() {
		if (this.local_stream == null) {
			
			this.data_channel = await this._peer_connection.createDataChannel(this.remote_peer_id)
			this.data_channel.onmessage = (msg) => { console.log("onmessage"); console.log(msg) };
			this.data_channel.onopen = (e) => { console.log("onopen"); console.log(e) };
			this.data_channel.onclose = (e) => { console.log("onclose"); console.log(e) };
			return 
		}

		for (const track of this.local_stream.getTracks()) {
			this._peer_connection.addTrack(track, this.local_stream);
		}
	}

	async Close() {
		this._peer_connection.close()
		await this.signaling.RemoveRemoteStream(this.remote_peer_id)
	}

	async SetRemoteOffer(offer) {
		let desc = new RTCSessionDescription(offer)
		await this._peer_connection.setRemoteDescription(desc)

		let senders = this._peer_connection.getSenders();
		senders.forEach((sender) => this._peer_connection.removeTrack(sender));
		if (this.local_stream != null) {
			for (const track of this.local_stream.getTracks()) {
				try {
					this._peer_connection.addTrack(track, this.local_stream);
				}catch (ex) { console.error(ex) }
			}
		}
		let answer = await this._peer_connection.createAnswer()
		await this._peer_connection.setLocalDescription(answer)

		await this.signaling.SendAnswer(this.remote_peer_id, this._peer_connection.localDescription)
	}

	async SetRemoteAnswer(answer) {
		let desc = new RTCSessionDescription(answer)
		await this._peer_connection.setRemoteDescription(desc)
		this.data_channel = await this._peer_connection.createDataChannel(this.remote_peer_id)
		this.data_channel.onmessage = (msg) => { console.log("onmessage"); console.log(msg) };
		this.data_channel.onopen = (e) => { console.log("onopen"); console.log(e) };
		this.data_channel.onclose = (e) => { console.log("onclose"); console.log(e) };
	}

	async _OnNegotiationNeedded() {
		try {
			this.local_offer = await this._peer_connection.createOffer()
			
			console.log("====> OFFER")
			console.log(this.local_offer)
	
			await this._peer_connection.setLocalDescription(this.local_offer);

			await this.signaling.SendOffer(this.remote_peer_id, this.local_offer)
	
		} catch (err) {
			console.error(err);
		} 
	}

	async _OnIceCandidate(candidate) { 
		
		if (candidate == null)
			return

		this.local_ice_candidates.push(candidate)
		console.log("====> CANDIDATE")
		console.log(candidate)

		await this.signaling.SendCandidate(this.remote_peer_id, candidate)
	}

	async _OnTrack(track, streams) {
		console.log("ON TRACK")
		this.signaling.AddRemoteStream(this.remote_peer_id, streams[0])

		// track.onunmute = () => {
		// 	if (remoteView.srcObject) 
		// 		return;
			
		// 	remoteView.srcObject = streams[0];
		// }
	}
	

}