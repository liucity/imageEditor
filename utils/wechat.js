import { merge, tryParse, clearEmptyProps } from './util.js';

export function promisify(fn, ...keys) {
  return function(){
    let params = {};
    (keys || []).forEach((key, i) => params[key] = arguments[i]);
    return new Promise((res, rej) => fn(Object.assign(params, {success: res, fail: rej})));
  }
}

let hostHeadersMap = {};
let findHost = (url) => {
  let match = url.match(/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/) || [];
  let matched = {};
  ["url", "scheme", "slash", "host", "port", "path", "query", "hash"].forEach((key, i) => matched[key] = match[i]);
  return matched['host'];
}

let handleCookie = (url, rst) => {
  if (!rst.header) return;
  let host = findHost(url);
  let cookie = rst.header["Set-Cookie"];
  if (cookie != null && host) {
    hostHeadersMap[host] = {
      cookie: cookie
    };
  }
}

let handleRequestOptions = (api, path, params) => {
  let opts = merge(true, {
    url: `${api}/${path}`,
    method: "POST",
    ignoreLoading: false
  }, params);

  let host = findHost(opts.url);
  if (host) {
    merge(true, opts, {
      header: hostHeadersMap[host] || {}
    });
  }

  return opts;
}

let handleResult = (rst) => {
  return new Promise((res, rej) => {
    let { code, mesg, data } = rst;

    if (mesg && mesg !== '成功' && mesg !== 'success') {
      wx.showToast({
        icon: 'none',
        title: mesg,
        duration: 3000
      });
    }

    switch (code) {
      case '-1':
        wx.redirectTo({
          url: `../index/index`
        });
        break;
      case '0':
        res(data);
        break;
      case '1':
        rej(rst.data);
        break;
      case '2':
        wx.redirectTo({
          url: `../index/index`
        });
        break;
      default:
        throw new Error('code is not defined!');
        break;
    }
  })
}

/**
 * Promise化小程序接口
 */
let Wechat = {
  promisify,
  login: promisify(wx.login),
  getUserInfo: promisify(wx.getUserInfo),
  setStorage: promisify(wx.setStorage, 'key', 'data'),
  getStorage: promisify(wx.getStorage, 'key'),
  removeStorage: promisify(wx.removeStorage, 'key'),
  clearStorage: promisify(wx.clearStorage),
  getLocation: promisify(wx.getLocation, 'type'),
  getSetting: promisify(wx.getSetting),

  request(api, path, data, params) {
    return new Promise((res, rej) => {
      let opts = handleRequestOptions(api, path, params);
      merge(true, opts, {
        data: clearEmptyProps(data),
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        },
        success: (rst) => {
          handleCookie(opts.url, rst);

          res(rst);
        },
        fail: (err) => {
          wx.showToast({
            icon: 'none',
            title: err.errMsg,
            duration: 3000
          });
          rej(err);
        },
        complete() {
          if (!opts.ignoreLoading) {
            wx.hideLoading();
          }
        }
      });
      if (!opts.ignoreLoading){
        wx.showLoading({
          title: '',
        })
      }
      wx.request(opts);
    });
  },
  
  requestHandleResult(api, path, data, params) {
    return this.request(...arguments)
      .then(rst => {
        console.info(path, data, params, rst.data);
        return handleResult(rst.data);
      });
  },
  requestImage(api, path, data, params){
    return this.request(api, path, data, Object.assign({
        method: 'GET',
        responseType: 'arraybuffer',
        ignoreLoading: true
      }, params))
      .then(rst => {
        let type = 'image/jpeg';
        if (rst && rst.header) {
          type = rst.header['Content-Type'];
          type = type.split(';').find(t => t.indexOf('/') > -1);
        }
        let base64 = wx.arrayBufferToBase64(rst.data);
        return `data:${type};base64,${base64}`;
      });
  },

  uploadFile(api, path, data, params){
    return new Promise((res, rej) => {
      let opts = handleRequestOptions(api, path, params);
      merge(true, opts, {
        filePath: null,
        name: 'file',
        formData: Object.assign({}, data),
        success: (rst) => {
          handleCookie(opts.url, rst);

          res(tryParse(rst.data));
        },
        fail: (err) => {
          wx.showToast({
            icon: 'none',
            title: err.errMsg,
            duration: 3000
          });
          rej(err);
        },
        complete() {
          if (!opts.ignoreLoading) {
            wx.hideLoading();
          }
        }
      });

      console.info(opts);
      if (!opts.ignoreLoading) {
        wx.showLoading({
          title: '正在上传',
        })
      }

      let uploadTask = wx.uploadFile(opts);
      if (uploadTask.onHeadersReceived){
        uploadTask.onHeadersReceived(rst => {
          handleCookie(opts.url, rst);
        });
      }
    });
  },
  uploadHandleResult(api, path, data, params) {
    return this.uploadFile(...arguments)
      .then(rst => {
        console.info(path, data, params, rst);
        return handleResult(rst);
      });
  },

  getBase64TempPath(base64data) {
    const fsm = wx.getFileSystemManager();
    const FILE_BASE_NAME = 'tmp_base64src';

    return new Promise((resolve, reject) => {
      const [, format, bodyData] = /data:image\/(\w+);base64,(.*)/.exec(base64data) || [];
      if (!format) {
        reject(new Error('ERROR_BASE64SRC_PARSE'));
      }
      const filePath = `${wx.env.USER_DATA_PATH}/${FILE_BASE_NAME}.${format}`;
      const buffer = wx.base64ToArrayBuffer(bodyData);
      fsm.writeFile({
        filePath,
        data: buffer,
        encoding: 'binary',
        success() {
          resolve(filePath);
        },
        fail() {
          reject(new Error('ERROR_BASE64SRC_WRITE'));
        },
      });
    });
  }
};

export default Wechat;