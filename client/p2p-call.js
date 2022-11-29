import PeerConnection from "./peer-connection";

let P2PCall = {

	PeerConnections: {},

	Connect: async (ServerUrl) => {

		P2PCall.ws = new WebSocket(ServerUrl)
		P2PCall.ws.onmessage = async (ws_msg) => {
			const msg = JSON.parse(ws_msg.data);
			console.log(msg)
			let method = null
			if (msg.cmd != null && (method=P2PCall.Protocol[msg.cmd]) != null)
				await method(P2PCall.ws, msg) 
		};

		return new Promise((resolve, reject) => {
			const timer = setInterval(() => {
				if(P2PCall.ws.readyState === 1) {
					clearInterval(timer)
					resolve(this.ws);
				}
			}, 10);
		});
	},

	SetLocalStream: async (stream) => {
		P2PCall.local_stream = stream
	},

	Send: async (msg) => {
		await P2PCall.ws.send(JSON.stringify(msg))
	},

	SendOffer: async (offer) => {
		P2PCall.Send({
			cmd: 'OFFER',
			data: offer
		})
	},

	SendAnswer: async (destination_id, offer) => {
		P2PCall.Send({
			cmd: 'OFFER',
			data: offer
		})
	},

	Protocol: {

		NEW_PEER: async (ws, msg) => {
			PeerConnections[msg.sender_id] = new PeerConnection(msg.sender_id, P2PCall.local_stream, P2PCall)
		},

		OFFER: async (ws, msg) => {
			console.log(msg)
			if (P2PCall.OnOfferReceived != null)
				P2PCall.OnOfferReceived(msg.sender_id, msg.data)
		},

		ANSWER: async (ws, msg) => {
			console.log(msg)
		},

		CANDIDATE: async (ws, msg) => {
			console.log(msg)
		}
	}
	
	
}

export default P2PCall