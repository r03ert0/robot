let btdevice;
let myServer;
let myDescriptor;
let myWheelsCharacteristic;
let myDistanceCharacteristic;
let reconnect = true;
let reconnectionDelay = 2000;
const MOTOR_SERVICE_UUID = "277eaf48-6698-4da9-8329-335d05343490";
const WHEELS_CHAR_UUID    = "277eaf49-6698-4da9-8329-335d05343490";
const HEAD_CHAR_UUID    = "277eaf49-6698-4da9-8329-335d05343491";
const SENSOR_SERVICE_UUID = "478e24cf-5e0c-451d-b220-02aacd43f0c1";
const DISTANCE_CHAR_UUID  = "478e24cf-5e0c-451d-b220-02aacd43f0c1";

const onDisconnected = (ev) => {
  /*
  check here for a more sophisticated exponential backoff algorithm:
  https://googlechrome.github.io/samples/web-bluetooth/automatic-reconnect.html
  */
  console.log("disconnected");
  console.log(ev);
  if (reconnect) {
    console.log("reconnect");
    setTimeout(connect, reconnectionDelay);
  }
}

const connect = () => {
  console.log("trying to connect...");
  btdevice.gatt.connect();
};

const disconnect = () => {
  console.log("trying to disconnect...");
  btdevice.gatt.disconnect();
};

const handleNotifications = (event) => {
  console.log("Notification");
  let value = event.target.value;
  let a = [];
  for (let i = 0; i < value.byteLength; i++) {
    a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
  }
  console.log('> ' + a.join(' '));
};

const handleDistanceNotifications = (event) => {
  const value = event.target.value.getInt32(0, true);
  // console.log(`> ${value} cm` );
  document.querySelector("#distance").innerText = `Front: ${value} cm`;
};

const requestBluetoothDevice = () => {
  console.log('Requesting Bluetooth Device...');

  let options = {
    acceptAllDevices: true,
    optionalServices: [MOTOR_SERVICE_UUID, SENSOR_SERVICE_UUID]
  };

  navigator.bluetooth.requestDevice(options)
    .then(device => {
      btdevice = device;
      console.log('> Name:             ' + device.name);
      console.log('> Id:               ' + device.id);
      console.log('> Connected:        ' + device.gatt.connected);

      device.addEventListener('gattserverdisconnected', onDisconnected);

      return device.gatt.connect();
    })
    .then(server => {
      console.log('Getting services...');
      myServer = server;
      return server.getPrimaryServices();
    }).then(services => {
      for (const service of services) {
        if (service.uuid === MOTOR_SERVICE_UUID) {
          console.log("Got motor service");
          service.getCharacteristics()
          .then((characteristics) => {
            for (const characteristic of characteristics) {
              console.log("Got characteristic: " + characteristic.uuid);
              if (characteristic.uuid === WHEELS_CHAR_UUID) {
                myWheelsCharacteristic = characteristic;
              }
              if (characteristic.uuid === HEAD_CHAR_UUID) {
                myHeadCharacteristic = characteristic;
              }
            }
          });
        }
        if (service.uuid === SENSOR_SERVICE_UUID) {
          console.log("Got sensor service");
          service.getCharacteristics(DISTANCE_CHAR_UUID)
          .then((characteristics) => {
            console.log("Got distance characteristic");
            myDistanceCharacteristic = characteristics[0];

            myDistanceCharacteristic.startNotifications().then(_ => {
              console.log('> Notifications started');
              myDistanceCharacteristic.addEventListener('characteristicvaluechanged',
                  handleDistanceNotifications);
            });

          });    
        }
      }
    })
    .catch(error => {
      console.log('ERROR: ' + error);
    });
};

const stringToArrayBuffer = (str) => {
  let encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

const numberToArrayBuffer = (num) => {
  let buffer = new ArrayBuffer(2);
  let view = new DataView(buffer);
  view.setInt16(0, num, true);
  return buffer;
}

const writeToBluetooth = async (val) => {
  if (val[0] === "w") {
    const data = stringToArrayBuffer(val.slice(1));
    return await myWheelsCharacteristic.writeValueWithResponse(data);
  } else if (val[0] === "h") {
    // const data = stringToArrayBuffer(val.slice(1));
    const short = numberToArrayBuffer(Number(val.slice(1)));
    return await myHeadCharacteristic.writeValueWithResponse(short);
  }
};

const readFromBluetooth = () => {
  if (!myDescriptor) {
    console.log("WARNING: No descriptor");
    return;
  }

  let decoder = new TextDecoder('utf-8');

  myDescriptor.readValue()
  .then((value) => {
    console.log('> Characteristic User Description changed to: ', value);
    console.log(decoder.decode(value));
  })
  .catch(error => {
    console.log('ERROR:', error);
  });

  myWheelsCharacteristic.readValue()
  .then((value) => {
    console.log('> Characteristic:', value);
    console.log(decoder.decode(value));
  })
  .catch(error => {
    console.log('ERROR:', error);
  });
};
