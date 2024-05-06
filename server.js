const port = 8000;
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

// Create HTTP server
const httpServer = http.createServer();

httpServer.on('error', (error) => {
    console.error('HTTP server error:', error);
});

httpServer.listen(port, () => {
    console.log(`HTTP/WS server is listening on port ${port}`);
});

// Create WebSocket server
const ws = new WebSocket.Server({ noServer: true }); // Using 'noServer' option

httpServer.on('upgrade', (request, socket, head) => {
    // Handle WebSocket handshake manually
    ws.handleUpgrade(request, socket, head, (thews) => {
        ws.emit('connection', thews, request);
    });
});

let hqSignal = null;
let hqSocket = null;
let robotSignal = null;
let robotSocket = null;

function receiveMessage(sourceSocket, msg) {
	const data = JSON.parse(msg);
	switch (data.type) {
		case "echo":
			console.log("ECHO:", data.msg);
			break;
		case "hq-join": // HQ joins the connection: store its socket
			console.log("hq-join");
			hqSocket = sourceSocket;
			break;
		case "hq-signal": // HQ starts the connection
			console.log("hq-signal");
			hqSignal = data.msg;
			hqSocket = sourceSocket;
			break;
		case "robot-join": // Robot joins the connection: send HQ signal
			console.log("robot-join");
			robotSocket = sourceSocket;
			if (hqSignal === null) {
				console.log("ERROR: No HQ");
				return;
			}
			try {
				robotSocket.send(JSON.stringify({type:"signal", msg: hqSignal, from: "hq"}));
			} catch (e) {
				console.log("ERROR: hq unable to signal to robot");
			}
			break;
		case "robot-signal": // Robot sends signal: send to HQ
			console.log("robot-signal");
			robotSignal = data.msg;

			if (hqSocket === null) {
				console.log("ERROR: No HQ");
				return;
			}
			try {
				hqSocket.send(JSON.stringify({type:"signal", msg:robotSignal, from: "robot"}));
			} catch (e) {
				console.log("ERROR: unable to forward signal to HQ");
			}
			break;
		default:
			console.log("Forward:", data);
			try {
				robotSocket.send(JSON.stringify({type:data.type, msg: data.msg, from: "hq"}));
			} catch (e) {
				console.log("ERROR: unable to forward message to robot");
			}
			break;
	}
}

ws.on('connection', (sourceSocket) => {
    console.log('WebSocket client connected');
	sourceSocket.send(JSON.stringify({msg: "server ping"}));

	sourceSocket.on('message', (msg) => {
		receiveMessage(sourceSocket, msg);
	});

    sourceSocket.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

httpServer.on('request', (req, res) => {
    let filePath = __dirname + req.url;
    if (filePath === __dirname + '/') {
        filePath = __dirname + '/index.html';
    }
	// console.log("File:", filePath);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200);
            res.end(data);
        }
    });
});
