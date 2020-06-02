// 日期中不足10的补0
const tf = i => (i < 10 ? '0' : '') + i;

// 格式化日期 e.g. format = 'yyyy-MM-dd HH:mm:ss', 默认为yyyy-MM-dd
export const formatDate = (time, format = 'yyyy-MM-dd') => {
  let t = time instanceof Date ? time : new Date(isNaN(time) ? time : +time);
  return format.replace(/yyyy|MM|dd|HH|mm|ss/g, function (a) {
    switch (a) {
      case 'yyyy':
        return tf(t.getFullYear()) > 1970 ? tf(t.getFullYear()) : ''
      case 'MM':
        return tf(t.getMonth() + 1)
      case 'mm':
        return tf(t.getMinutes())
      case 'dd':
        return tf(t.getDate())
      case 'HH':
        return tf(t.getHours())
      case 'ss':
        return tf(t.getSeconds())
    }
  })
}

export function merge(isDeep, target, ...args) {
  if (typeof isDeep !== 'boolean'){
    args.unshift(target);
    target = isDeep;
    isDeep = false;
  }

  args.forEach(arg => {
    if (arg != null){
      Object.keys(arg).forEach(key => {
        let value = arg[key];
        if (typeof value === 'object' && isDeep) {
          target[key] = merge(isDeep, target[key] || {}, value);
        } else {
          target[key] = value;
        }
      })
    }
  });

  return target;
}

export function tryParse(data) {
  try {
    return JSON.parse(data);
  } catch (e){
    return null;
  }
}

export function clearEmptyProps(obj){
  if (obj == undefined) return obj;
  let rst = {};
  
  Object.keys(obj).forEach(prop => {
    if(obj[prop] !== undefined) 
      rst[prop] = obj[prop];
  });

  return rst;
}

export function filterObjectProps(obj, ...props) {
  if (!obj) return;
  const rst = {};

  props.forEach(prop => {
    if (obj[prop] != undefined && obj[prop] !== '') {
      rst[prop] = obj[prop];
    }
  });

  return rst;
}


const delimiterReg = /([^\.\[\]])+/g
  //获取值
export function getter(obj, properties) {
  const props = properties.match(delimiterReg) || [];

  for (let prop of props) {
    obj = obj[prop];
    if (obj === undefined) break;
  }

  return obj
}
  //设置对象属性
export function setter(obj, properties, value) {
  let props = properties.match(delimiterReg);
  let lastProp = props.pop();
  let target = obj;

  props.forEach(prop => {
    if (!target[prop]) {
      target[prop] = {};
    }
    target = target[prop];
  })
  target[lastProp] = value;

  return obj;
}

export function group(arr, cb){
  if (!arr || !arr) return arr;
  if (!cb) cb = (item) => item;
  const rst = new Map();

  if (arr) {
    arr.forEach(item => {
      const key = cb(item);
      const stringifiedKey = JSON.stringify(key);
      if (!rst.has(stringifiedKey)) {
        let arr = [];
        arr.key = JSON.parse(stringifiedKey);
        rst.set(stringifiedKey, arr);
      }

      const arr = rst.get(stringifiedKey);
      arr.push(item);
    });

    return [...rst.values()];
  }
}

export function lowerCaseWord(input) {
  if (!input) return input;
  return input[0].toLowerCase() + input.substr(1);
}

const tostring = Object.prototype.toString;
export function type(obj) {
  let typeKeyMatch = /\[object\s([^\]]*)\]/.exec(tostring.call(obj));
  let typeKey = typeKeyMatch && typeKeyMatch[1];
  return lowerCaseWord(typeKey);
}

export function throttle(fn, interval = 17) {
  let previous = null;

  return function () {
    let now = Date.now();
    if (!previous || now - previous >= interval) {
      fn.apply(this, arguments);
      previous = now;
    }
  }
}

export function debounce(fn, interval = 500) {
  let timeid;

  return function(){
    if (timeid) clearTimeout(timeid);
    timeid = setTimeout(() => {
      fn.apply(this, arguments);
      timeid = undefined;
    }, 500);
  } 
}

//压缩
export function arrayCompress(datas, ignoreFields = []) {
  let rst = {};
  let map = {};
  let keys;
  datas.forEach(item => {
    if (!keys) {
      keys = Object.keys(item).filter(key => ignoreFields.indexOf(key) === -1);
      keys.forEach(key => {
        rst[key] = [];
        map[key] = [];
      });
    }

    keys.forEach(key => {
      let value = item[key];
      let valueIndex = map[key].indexOf(value);
      if (valueIndex === -1) {
        map[key].push(value);
        valueIndex = map[key].length - 1;
      }

      rst[key].push(valueIndex);
    });
  })

  rst._map = map;

  return rst;
}

//解压
export function arrayDecompress(datas) {
  let rst;
  let map = datas._map || {};
  let keys = [];

  Object.keys(datas).forEach((key, i) => {
    if (key === '_map') return;
    if (!rst) {
      rst = new Array(datas[key].length).fill(0).map(() => ({}));
    }
    keys.push(key);
  });

  keys.forEach(key => {
    let _map = map[key];
    datas[key].forEach((value, i) => {
      rst[i][key] = _map[value];
    });
  });

  return rst;
}