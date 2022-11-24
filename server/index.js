const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const SignalerServer = require('signaler-server');

const wss = new WebSocket.Server({ port: 8000 });
const clients = new Map();

wss.on('connection', (ws) => {
    let protocol = ws.protocol
    const id = uuidv4();
    const color = Math.floor(Math.random() * 360);
    const client = { id, color, ws };

    clients.set(ws, client);

    ws.on('message', (messageAsString) => {
        const msg = JSON.parse(messageAsString);
        const client = clients.get(ws);

        let method = SignalerServer[msg.cmd]
        if (method != null)
            method(client, msg)
    })

})