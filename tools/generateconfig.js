const hap = require('hap-nodejs');
const fs = require('fs');

const config = {};

Object
  .keys(hap.Service)
  .forEach(key => {
    try {
      const service = new hap.Service[key]('0');
      console.log(key, service.characteristics.length)
      if (true) {
        config[key] = { 
          title: camelToCase(key),
          propsMain: {},
          propsExp: {},
        }
   
        service.characteristics.forEach(i => {
          config[key].propsMain[i.constructor.name] = { 
            title: i.displayName,
            type: i.props.format,
            perms: i.props.perms.reduce((p, c) => ({ ...p, [c]: true }), {})
          };
        })

        service.optionalCharacteristics.forEach(i => {
          config[key].propsExp[i.constructor.name] = { 
            title: i.displayName,
            type: i.props.format,
            perms: i.props.perms.reduce((p, c) => ({ ...p, [c]: true }), {})
          };
        })
      }
    } catch {
      
    }
  });

function camelToCase(text) {
  return text.replace(/([A-Z]+)*([A-Z][a-z])/g, "$1 $2").trim();
}
 

fs.writeFileSync('./hap.config', JSON.stringify(config, null, 2))
