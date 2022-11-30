const { v4: uuidv4 } = require('uuid');

const interval = setInterval(() => {
	for (var entry of SignalerServer._ConnectedClients.entries()) {
		var ws = entry[0]
		
		if (ws.isAlive === false) {
			ws.terminate();
			continue;
		}

		ws.isAlive = false;
		ws.ping();
	}
}, 10000);

module.exports = SignalerServer = {

	_ConnectedClients : new Map(),

	SendTo: (sender_client_id, destination_client_id, msg)=>{
		msg.sender_id = sender_client_id
		msg.destination_id = destination_client_id
		for (var entry of SignalerServer._ConnectedClients.entries()) {
			
			if (entry[1].id != destination_client_id)
				continue

			let ws = entry[0]
			ws.send(JSON.stringify(msg))
			
		}
	},

	Broadcast: (sender_client, msg)=>{
		for (var entry of SignalerServer._ConnectedClients.entries()) {
			var ws = entry[0]
			if (ws == sender_client.ws)
				continue

			msg.sender_id = sender_client.id
			ws.send(JSON.stringify(msg))
		}
	},

	Clients: {
		Add: async (ws)=>{
			ws.isAlive = true
			let new_client = { "id": uuidv4(), "ws": ws }
			await SignalerServer.Broadcast(new_client, { cmd: "NEW_PEER" })
			SignalerServer._ConnectedClients.set(ws, new_client);
		},

		Get: (ws)=>{
			return SignalerServer._ConnectedClients.get(ws);
		},

		Remove: async (ws) => {
			let removed_client = SignalerServer._ConnectedClients.get(ws)
			SignalerServer._ConnectedClients.delete(ws)
			await SignalerServer.Broadcast(removed_client, { cmd: "REMOVE_PEER" })
		},

		Pong: (ws) => {
			ws.isAlive = true
		}
	},

	ProtocolMethods: {

		OFFER: async (sender_client, msg)=> {
			SignalerServer.SendTo(sender_client.id, msg.destination_id, msg)
		},

		ANSWER: async (sender_client, msg)=> {
			SignalerServer.SendTo(sender_client.id, msg.destination_id, msg)
		},

		CANDIDATE: async (sender_client, msg)=> {
			SignalerServer.SendTo(sender_client.id, msg.destination_id, msg)
		}
	},


} 