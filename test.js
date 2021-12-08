const { fork } = require('child_process');
const os = require('os');


const options = {
  port: 8088,
  syspath: '/opt/ih-v5',
  hwid: '23a2cab6b81b02d18668fa676e8f3c4eb68577cb33f02be50774b4bfa742ae09-1110',
  logfile: '/opt/ih-v5/log/ih_apple_homekit.log',
  temppath: os.tmpdir(),
  conf: 0,
}

const params = { 
  mac: '18:61:07:D4:AC:EE',
  pincode: '678-90-876',
  port: '47129',
  category: 1,
  setupid: '67E8',
};
const channels = []

const devices = `[{"_id":"d0051","Name":"DD001_1 ▪︎ Датчик движения","active":1,"custom":0,"type":"t009"},{"_id":"d0383","Name":"H001 ▪︎ Диммер","active":1,"custom":1,"haptype":"Lightbulb","On":"state","On_on":"on","On_off":"off","type":"t018"}]`
const types = `[{"_id":"t009","haptype":"MotionSensor","MotionDetected":"state", "title": "MotionSensor"},{"_id":"t018","haptype":"ContactSensor","ContactSensorState":"state", "title": "ContactSensor"}]`;

const forked = fork('index.js', [JSON.stringify(options), 'debug']);

forked.on('message', (msg) => {
  if (msg.type === 'get' && msg.name === 'params') {
    forked.send({ ...msg, response: 1, data: params })
  } else if (msg.type === 'get' && msg.name === 'channels') {
    forked.send({ ...msg, response: 1, data: channels })
  } else if (msg.type === 'get' && msg.name === 'devices') {
    forked.send({ ...msg, response: 1, data: JSON.parse(devices) })
  } else if (msg.type === 'get' && msg.name === 'types') {
    forked.send({ ...msg, response: 1, data: JSON.parse(types) })
  } else {
    console.log(msg);
  }
});