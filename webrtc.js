let socket;
let peer;
const initiator = location.hash === '#hq';

/*
    Web socket
*/

const sendMessage = (type, msg) => {
    socket.send(JSON.stringify({
        type, msg
    }));
};
    
/*
WebRTC
*/

const gotMedia = (stream) => {
    peer = new SimplePeer({
        initiator,
        trickle: false,
        stream
    });
    peer.on('error', err => console.log('error', err));
    peer.on('signal', (data) => {
        console.log("got signal");
        const signal = JSON.stringify(data);

        if (initiator) {
            sendMessage("hq-signal", signal);
        } else {
            sendMessage("robot-signal", signal);
        }
    });    
    peer.on('connect', () => {
        peer.send('whatever:', Math.random());
    });
    peer.on('data', data => {
        console.log('data:', data);
    });
    peer.on('stream', stream => {
        // got remote video stream, now let's show it in a video tag
        const video = document.querySelector('#video');
        video.srcObject = stream;
        video.play();
    });
};

const initSocketConnection = (host, onmessage) => {
    const pr = new Promise((resolve, reject) => {
        let s;
        try {
            s = new WebSocket(host);
            s.onopen = (msg) => {
                console.log("socket open");
                resolve(s);
            };
            s.onmessage = onmessage;
            s.onclose = (msg) => {
                console.log("[initSocketConnection] onclose", msg);
            };
        }
        catch (ex) {
            console.log("Not connected - connection error");
            reject(ex);
        }
    });
    return pr;
};

const main = async (onmessage) => {
    // init socket connection
    socket = await initSocketConnection("wss://robot.braincatalogue.org", onmessage);

    if (initiator) {
        sendMessage("hq-join", "");
    } else {
        sendMessage("robot-join", "");
    }

    // get video/voice stream
    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
    }).then(gotMedia).catch(console.log);
};
