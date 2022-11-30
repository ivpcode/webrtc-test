const WebSocket = require('ws');
const SignalerServer = require('./signaler-server');

process.on('uncaughtException', (err) => {
    console.log('Caught exception: ' + err);
});


const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', async (ws) => {
    let protocol = ws.protocol

    await SignalerServer.Clients.Add(ws)

	
    ws.on('message', (messageAsString) => {
		try {
			const msg = JSON.parse(messageAsString);
			let method = SignalerServer.ProtocolMethods[msg.cmd]

			const client = SignalerServer.Clients.Get(ws);

			if (client!=null && method != null)
				method(client, msg)
		}
		catch (ex) {
			console.log(ex)
		}
    })

	ws.on('pong', ()=>{
		SignalerServer.Clients.Pong(ws)
	})

	ws.on('close', async ()=>{
		await SignalerServer.Clients.Remove(ws)
	})
})
