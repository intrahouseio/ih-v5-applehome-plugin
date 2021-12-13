const plugin = require('ih-plugin-api')();
const hap = require('hap-nodejs');
const path = require('path');

let isFirstSubMessage = true;

let opt = {};
let settings = {};
let channels = [];
let devices = [];
let types = [];

const store = {}
const values = {};
const subs = {};

async function main() {
  opt = plugin.opt;
  settings = await plugin.params.get();
  // channels = await plugin.channels.get();
  devices = await plugin.devices.get();
  types = await plugin.types.get();

  hap.HAPStorage.setCustomStoragePath(path.join(__dirname, 'db'));


  const hub = new hap.Bridge("IH Hub", hap.uuid.generate("hap.ih.hub"));
  hub.getService(hap.Service.AccessoryInformation)
  .setCharacteristic(hap.Characteristic.Name, 'IH Hub')
  .setCharacteristic(hap.Characteristic.Manufacturer, 'IH')
  .setCharacteristic(hap.Characteristic.SerialNumber, opt.conf === 2 ? 'IntraScada' : 'IntraHouse')


  devices.forEach(device => {
    try {
      if (device.active && hap.Service[device.haptype]) {
        const type = types.find(i => i._id === device.type);
        if (device.inherit) {
          if (type) {
            device = { ...type, active: 1, _id: device._id, Name: device.Name }
          }
        }

        // device.className = type.title;

        const accessory = new hap.Accessory(device.Name, hap.uuid.generate("hap.ih.hub." + device._id));        
        accessory
          .getService(hap.Service.AccessoryInformation)
          .setCharacteristic(hap.Characteristic.Name, device.Name)
          .setCharacteristic(hap.Characteristic.SerialNumber, device._id)
          .setCharacteristic(hap.Characteristic.Manufacturer, opt.conf === 2 ? 'IntraScada' : 'IntraHouse');
        
        const service = new hap.Service[device.haptype](device.Name, device._id);
        
        store[device._id] = { accessory, service, props: {} }

        const list = [];

        service.characteristics.forEach(i => list.push(i));
        service.optionalCharacteristics.forEach(i => list.push(i));

        list.forEach((_characteristic) => {
          const cid = _characteristic.constructor.name;
          if (cid !== 'Name' && (device[cid] !== undefined && device[cid] !== '' && device[cid] !== '-') && hap.Characteristic[cid] !== undefined) {
            const pid = device[cid];

            subs[device._id + '.' + pid] = true;

            const characteristic = service.getCharacteristic(hap.Characteristic[cid]);

            characteristic.on(hap.CharacteristicEventTypes.GET, (callback) => {
              const value = values[device._id + '_' + pid];
              callback(undefined, value);
            });

            characteristic.on(hap.CharacteristicEventTypes.SET, (value, callback) => {
              callback();

              if (characteristic.props.format === 'bool' && characteristic.props.perms.includes('pw')) {

                const actcid = value ? cid + '_on' : cid + '_off';

                if (device[actcid] !== undefined) {
                  plugin.sendCommand({ did: device._id, act: device[actcid] })
                }
              } else {
                plugin.sendCommand({ did: device._id, act: 'set', prop: pid, value })
              }
            });

            if (characteristic.props.minValue !== undefined && device[`${pid}_min`] !== undefined) {
              characteristic.setProps({ minValue: device[`${pid}_min`] })
            }

            if (characteristic.props.maxValue !== undefined && device[`${pid}_max`] !== undefined) {
              characteristic.setProps({ maxValue: device[`${pid}_max`] })
            }

            if (store[device._id].props[pid] === undefined) {
              store[device._id].props[pid] = [];
            }

            store[device._id].props[pid].push(characteristic);
          }
        });
      }
    } catch (e) {
      plugin.log(e.stack)
    }
 
  });

  Object
    .keys(store)
    .forEach(key => {
      store[key].accessory.addService(store[key].service);
      hub.addBridgedAccessory(store[key].accessory)
    })
  
  hub._setupID = settings.setupid;
  hub.publish({
    username: settings.mac,
    pincode: settings.pincode,
    port: Number(settings.port),
    category: hap.Categories.BRIDGE,
    setupID: settings.setupid,
  });
  hub._accessoryInfo.displayName = `IH hub ${settings.setupid}`

  plugin.onSub('devices', { did_prop: Object.keys(subs) }, (data) => {
   data.forEach(device => {
    if (store[device.did] !== undefined && store[device.did].props[device.prop] !== undefined) {
      values[device.did + '_' + device.prop] = device.value;

      if (isFirstSubMessage === false) {
        const characteristics = store[device.did].props[device.prop];
        characteristics.forEach(characteristic => {
          characteristic.updateValue(device.value);
        })
      }
    }
   });

   if (isFirstSubMessage) {
    isFirstSubMessage = false;
   }
  });

  plugin.onChange('params', data => {
    process.exit(0);
  });

  plugin.onChange('devices', data => {
    process.exit(0);
  });

  plugin.onChange('types', data => {
    process.exit(0);
  });
}

main();


global.console.log = log;
global.console.warn = log;
global.console.error = log;
global.console.info = log;

function log(e) {
  if (typeof e === 'string') {
    plugin.log(e);
  } else {
    plugin.log(JSON.stringify(e));
  }
}