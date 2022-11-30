import PeerConnection from "./peer-connection";

export default class RoomConnection {

	constructor() {
		this.peer_connections = {}
	}

	async Connect(ServerUrl) {

		this.ws = new WebSocket(ServerUrl)
		this.ws.onmessage = async (ws_msg) => {
			const msg = JSON.parse(ws_msg.data);
			console.log("====> REMOTE")
			console.log(msg)
			let method = null
			if (msg.cmd != null && (method=this.Protocol(msg.cmd)) != null)
				await method(this.ws, msg) 
		};

		return new Promise((resolve, reject) => {
			const timer = setInterval(() => {
				if(this.ws.readyState === 1) {
					clearInterval(timer)
					resolve(this.ws);
				}
			}, 10);
		});
	}

	async SetLocalStream(stream) {
		this.local_stream = stream

		//new PeerConnection(123, this.local_stream, this)
	}

	async AddRemoteStream(remote_peer_id, stream) {

	}

	async RemoveRemoteStream(remote_peer_id) {
		
	}

	async Send(msg) {
		await this.ws.send(JSON.stringify(msg))
	}

	async SendOffer(destination_id, offer) {
		this.Send({
			cmd: 'OFFER',
			destination_id: destination_id,
			data: offer
		})
	}

	async SendAnswer(destination_id, answer) {
		this.Send({
			cmd: 'ANSWER',
			destination_id: destination_id,
			data: answer
		})
	}

	async SendCandidate(destination_id, candidate) {
		this.Send({
			cmd: 'CANDIDATE',
			destination_id: destination_id,
			data: candidate
		})
	}	

	Protocol(cmd) {
		switch (cmd) {
			case "NEW_PEER": return async (ws, msg) => {
				this.peer_connections[msg.sender_id] = new PeerConnection(msg.sender_id, this.local_stream, this)
				await this.peer_connections[msg.sender_id].StartConnectionNegotiation()
			}

			case "REMOVE_PEER": return async (ws, msg) => {
				let pc = this.peer_connections[msg.sender_id]
				delete this.peer_connections[msg.sender_id]
				if (pc != null)
					pc.Close()
			}

			case "OFFER": return async (ws, msg) => {
				let pc = this.peer_connections[msg.sender_id]
				if (pc == null) {
					this.peer_connections[msg.sender_id] = new PeerConnection(msg.sender_id, this.local_stream, this)
					pc = this.peer_connections[msg.sender_id]
				}

				await pc.SetRemoteOffer(msg.data)
			}

			case "ANSWER": return async (ws, msg) => {
				let pc = this.peer_connections[msg.sender_id]
				if (pc == null)
					return

				await pc.SetRemoteAnswer(msg.data)
			}

			case "CANDIDATE": return async (ws, msg) => {
				let pc = this.peer_connections[msg.sender_id]
				if (pc == null)
					return

				await pc.AddIceCandidate(msg.data)
			}
		}

		return null
	}
	
	
}

