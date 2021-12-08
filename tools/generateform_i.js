const fs = require('fs');


const config = JSON.parse(fs.readFileSync('./hap.config', 'utf8'));

const services = {}


const form = {
  spacing: 10,
  grid: [
    {
      id: 'main',
      xs: 6,
      class: 'main',
      table: '_devices',
    }
  ],
  main: [
    { prop: 'active', title: 'Включить в интеграцию', type: 'cb' },
    { prop: 'inherit', title: 'Наследовать настройки из типа', type: 'cb' },
    { prop: 'Name', title: 'Название', type: 'input' }
  ],
}


Object
  .keys(config)
  .forEach((key) => {
    const item = config[key];
    
    Object
      .keys(item.propsMain)
      .forEach(id => {
        preparationProp(key, item, id, item.propsMain[id]);
      })

    Object
      .keys(item.propsExp)
      .forEach(id => {
        preparationProp(key, item, id, item.propsExp[id], true);
      })
  });


function getTitle(propid, title) {
  return propid === 'On' ? 'State' : title;
}


function preparationProp(sid, service, propid, prop, isExp) {
  if (propid !== 'Name') {
    if (prop.type === 'int' || prop.type === 'uint16' || prop.type === 'uint32' || prop.type === 'uint8' || prop.type === 'float') {
      if (services[sid] === undefined) {
        services[sid] = { title: service.title, fields: [] };
      }

      const name = getTitle(propid, prop.title, isExp);

      services[sid].fields.push({
        sid, 
        title: isExp ? name : name + ' *', 
        prop: propid,
        type: 'droplist',
        data: '__devprop',
      })
    }

    if (prop.type === 'bool') {
      if (services[sid] === undefined) {
        services[sid] = { title: service.title, fields: [] };
      }

      const name = getTitle(propid, prop.title, isExp);

      services[sid].fields.push({
        sid, 
        title: isExp ? name : name + ' *',  
        prop: propid,
        type: 'droplist',
        data: '__devprop',
      })

      if (prop.perms.pw) {
        services[sid].fields.push({
          sid,  
          title: isExp ? name + ' On' : name  + ' On' + ' *',   
          prop: propid + '_on',
          type: 'droplist',
          data: '__devcmd',
        })
        services[sid].fields.push({
          sid,  
          title: isExp ? name + ' Off' : name  + ' Off' + ' *',   
          prop: propid + '_off',
          type: 'droplist',
          data: '__devcmd',
        })
      }

    }

    if (prop.type === 'string') {
      // console.log(sid, propid)
    }

    if (prop.type === 'data' || prop.type === 'tlv8') {
      // console.log(sid, propid)
    }
    
  }
}

const list = [];

Object
  .keys(services)
  .forEach(sid => {
    list.push({ id: sid, title: services[sid].title })
    form.grid.push({
      id: sid,
      xs: 6,
      class: 'main',
      table: "_devices",
      hide: `data.main.haptype.id != '${sid}' ?  true : data.main.inherit`,
    });

    form[sid] = services[sid].fields;
  }); 

form.main.push({ prop: 'haptype', title: 'Тип (HomeKit)', type: 'droplist', data: list, hide: 'data.main.inherit' })


fs.writeFileSync('./v5/formIntegration.json', JSON.stringify(form, null, 2), 'utf8')
