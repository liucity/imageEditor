import { promisify } from '../../utils/wechat.js';

export const getImageInfo = promisify(wx.getImageInfo, 'src');

export const getSystemInfo = promisify(wx.getSystemInfo);

export function saveTempFilePath(component, canvasId, { x, y, width, height, destWidth, destHeight }){
  return new Promise((res, rej) => {
    wx.canvasToTempFilePath({
      canvasId, 
      x, 
      y, 
      width, 
      height, 
      destWidth, 
      destHeight,
      success: res,
      fail: rej
    }, component);
  });
}

export function getStyleString (styles) {
  return Object.keys(styles)
    .map(key => `${key}: ${isNaN(styles[key]) ? styles[key] : Math.round(styles[key]) + 'px'}; `)
    .join('');
}