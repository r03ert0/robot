# WebRTC Bluetooth Arduino Telepresence Robot
RT, 6 May 2024

## Usage
- Start the server: `node server.js`.
- Use Chromium
- In the computer, go to https://darcy.local:8080, click on"HQ".
- In the phone, go to https://darcy.local:8080, click on "Robot".
- The video communication should start.
- Turn on the robot, and pair with the phone by pushing the "Pair" button and selecting the robot device "MyRobotDV8333".
- Use the arrow keys in the computer to move the robot.


## Files
- bleio.js: bluetooth connection
- server.js: the server for https and wss
- webrtc.js: video connection

## Notes

**27 April 2024**
Now reads a distance sensor through bluetooth

**16 Jan 2024**
Arduino Nano 33 BLE has a built-in accelerometer:
https://docs.arduino.cc/tutorials/nano-33-ble/imu-accelerometer

**15 Jan 2024**
Potential code for processing frame pixels:

```js
const canvas = document.getElementById('image');
const ctx = canvas.getContext('2d');
canvas.width = video.videoWidth; 
canvas.height = video.videoHeight;

const processFrame = () => {
    // draw video frame to ctx
    ctx.drawImage(video, 0, 0);

    // get image pixels
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const gotMedia = (stream) => {
    setInterval(processFrame, 100);

    // rest of the code
    // ...
}
```

**13 Jan 2024**
To do:
- the keyboard sends too many redundant calls. The code should verify and only send messages once.

## References

Simple-peer with Socket.io
https://gist.github.com/adammw/d9bf021c395835427aa0

Video-chat peer.js example
https://github.com/ourcodeworld/videochat-peerjs-example

Video frame processing on the web
https://webrtchacks.com/video-frame-processing-on-the-web-webassembly-webgpu-webgl-webcodecs-webnn-and-webtransport/
