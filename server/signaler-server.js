const { v4: uuidv4 } = require('uuid');

const interval = setInterval(() => {
	for (var entry of SignalerServer._ConnectedClients.entries()) {
		var ws = entry[0]
		if (ws.isAlive === false) 
			return ws.terminate();

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
		Add: (ws)=>{
			ws.isAlive = true
			SignalerServer._ConnectedClients.set(ws, { "id": uuidv4(), "ws": ws });
		},

		Get: (ws)=>{
			return SignalerServer._ConnectedClients.get(ws);
		},

		Remove: (ws) => {
			SignalerServer._ConnectedClients.delete(ws)
		},

		Pong: (ws) => {
			ws.isAlive = true
		}
	},

	ProtocolMethods: {

		OFFER: async (sender_client, msg)=> {
			SignalerServer.Broadcast(sender_client, msg)
		},

		ANSWER: async (sender_client, msg)=> {
			SignalerServer.SendTo(sender_client.id, msg.destination_id, msg)
		},

		CANDIDATE: async (sender_client, msg)=> {
			SignalerServer.Broadcast(sender_client, msg)
		}
	},


} 