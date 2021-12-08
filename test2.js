const hap = require('hap-nodejs');
const path = require('path');


const settings = { 
  mac: '17:51:07:F4:BC:8C',
  pincode: '678-90-876',
  port: '47129',
  category: 1,
  setupid: '77E8',
};


hap.HAPStorage.setCustomStoragePath(path.join(__dirname, 'db'));


const hub = new hap.Accessory("IH Hub", hap.uuid.generate("hap.ih.hub"));

i = 1;

Object
  .keys(hap.Service)
  .forEach((key, index) => {
    try {
      const service = new hap.Service[key](key);
        if (service.constructor.name.indexOf('Lightbulb') !== -1) {
          console.log(service.constructor.name)
          service.characteristics.forEach(i => {
            const cid = i.constructor.name;
            if (cid !== 'Name') {
            
              const characteristic = service.getCharacteristic(hap.Characteristic[cid]);
              characteristic.on(hap.CharacteristicEventTypes.GET, (callback) => {

    
              console.log(service.constructor.name, cid, characteristic.getDefaultValue())
              callback(undefined, characteristic.getDefaultValue());
              });
  
              characteristic.on(hap.CharacteristicEventTypes.SET, (value, callback) => {
                console.log(service.constructor.name, cid, value)
                callback();
              });
            
              console.log(i.displayName, i.props)
            }
          })
  
          console.log('------------------------------')
  
          service.optionalCharacteristics.forEach(i => {
            const cid = i.constructor.name;
            if (cid !== 'Name') {
              const characteristic = service.getCharacteristic(hap.Characteristic[cid]);
              characteristic.on(hap.CharacteristicEventTypes.GET, (callback) => {
                callback(undefined, characteristic.getDefaultValue());
              });
  
              characteristic.on(hap.CharacteristicEventTypes.SET, (value, callback) => {
                console.log(service.constructor.name, cid, value)
                callback();
              });
              
              console.log(service.constructor.name, i.displayName, i.props)
            }
          })
  
          hub.addService(service);
          console.log('');
        }
    } catch {

    }
  });


hub.publish({
  username: settings.mac,
   pincode: settings.pincode,
   port: settings.port,
   category: hap.Categories.OTHER ,
   setupID: settings.setupid,
 });