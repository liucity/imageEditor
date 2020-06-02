import * as helper from '../util.js';

export function calcRenderArea(component){
  let {
    width: screenW, height: screenH, imageStyles: { width, height },
    x, y, scale, fixedAreaSize
  } = component.getCache();
  console.log('--------', `screenW:${screenW}; screenH:${screenH}`, `imageW:${width}; imageH:${height}`, `x:${x};y:${y}`, scale);

  let fixedX = x - screenW * fixedAreaSize - width * (scale - 1) / 2;
  let fixedY = y - screenH * fixedAreaSize - height * (scale - 1) / 2;
  let sx = Math.max(fixedX, 0);
  let sy = Math.max(fixedY, 0);
  let sw = Math.min(screenW, fixedX + width * scale) - sx;
  let sh = Math.min(screenH, fixedY + height * scale) - sy;

  let area = {
    sx: Math.round(sx),
    sy: Math.round(sy),
    sw: Math.round(sw),
    sh: Math.round(sh),
    dx: Math.round((sx - fixedX) / scale),
    dy: Math.round((sy - fixedY) / scale),
    dw: Math.round(sw / scale),
    dh: Math.round(sh / scale)
  };
  console.log('src', JSON.stringify(area), `fx:${fixedX}; fy: ${fixedY}`);
  return area;
}

export function snapTemplate(){
  let { ratio, imageStyles: { width, height }, scale } = this.getCache();
  return helper.saveTempFilePath(this, 'templateCanvas', {
      x: 0, y: 0, width, height,
      destWidth: width * scale * ratio,
      destHeight: height * scale * ratio
    })
    .then(({ tempFilePath }) => {
      console.log('snapTemplate', tempFilePath)
      return tempFilePath;
    });
}

export function snapCover() {
  let renderArea = calcRenderArea(this);
  let { width, height, ratio } = this.getCache();
  return helper.saveTempFilePath(this, 'coverCanvas', {
      x: renderArea.sx, y: renderArea.sy, width: renderArea.sw, height: renderArea.sh,
      destWidth: renderArea.dw * ratio,
      destHeight: renderArea.dh * ratio
    })
    .then(({ tempFilePath }) => {
      console.log('snapCover', tempFilePath)
      return tempFilePath;
    });
}

export function stackCover(component) {
  let { width, height, ratio } = component.getCache();
  component.setCache('redo.stack', []);

  return helper.saveTempFilePath(component, 'coverCanvas', {
      x: 0, y: 0, width, height,
      destWidth: width * ratio,
      destHeight: height * ratio
    })
    .then(({ tempFilePath }) => {
      component.pushCache('image.stack', tempFilePath);
      enableUndo(component);
    });
}

export function enableUndo(component, enable = true){
  let { menus } = component.data;
  let menuIndex = menus.findIndex(m => m.name === 'undo');
  if (menuIndex > -1){
    component.setData({
      [`menus[${menuIndex}].disabled`]: !enable
    });
  }
}

export function stackTemplate(component){
  let { width, height, ratio } = component.getCache();
  component.setCache('redo.stack', []);

  // return helper.saveTempFilePath(component, 'templateCanvas', {
  //     x: 0, y: 0, width, height,
  // destWidth: width * ratio,
  //   destHeight: height * ratio
  //   })
  //   .then(({ tempFilePath }) => {
  component.pushCache('image.stack', component.data.canvasUrl);
  enableUndo(component);
  // });
}

export function saveCoverToTemplate(component) {
  return snapCover.call(component)
    .then(filePath => {
      let { templateContext } = component.getCache();
      let renderArea = calcRenderArea(component);

      templateContext.drawImage(filePath,
        renderArea.dx, renderArea.dy, renderArea.dw, renderArea.dh);
      return new Promise(res => templateContext.draw(true, res));
    });
}

export function goback() {
  console.log('goback');
  let menu = this.getCache('menu.current');

  if (menu.hide)
    menu.hide.call(this);

  let { menus, current } = this.popCache('menu.stack');

  let movable = this.getCache('image.movable');

  this.setData({
    isMovable: movable,
    menus: menus,
    mode: ''
  });

  this.setCache('menu.current', current);
}

export function undoCover() {
  console.log('undo');
  let filePath = this.popCache('image.stack');
  if (filePath) {
    let { width, height, context } = this.getCache();
    let menu = this.getCache('menu.current') || { enter() { } };
    context.drawImage(filePath, 0, 0, width, height);
    context.draw();
    menu.enter.call(this);

    if (!this.getCache('image.stack.length')) {
      enableUndo(this, false);
    }
  }
}

export function undoTemplate() {
  console.log('undo');
  let filePath = this.popCache('image.stack');
  if (filePath) {
    let { imageStyles: { width, height }, templateContext: context } = this.getCache();
    let menu = this.getCache('menu.current') || { enter() { } };

    if (filePath === 'data:image/png;base64,'){
      context.clearRect(0, 0, width, height);
    } else {
      context.drawImage(filePath, 0, 0, width, height);
    }

    context.draw(false, () => {
      this.setData({
        canvasUrl: filePath
      });
      menu.enter.call(this);
    });

    if (!this.getCache('image.stack.length')) {
      enableUndo(this, false);
    }
  }
}

export function redo() {
  console.log('redo');
  let filePath = this.popCache('redo.stack');
  if (filePath) {
    let { imageStyles: { width, height }, context } = this.getCache();
    snapCover.call(this)
      .then(path => {
        this.pushCache('image.stack', path);
        context.drawImage(filePath, 0, 0, width, height);
        context.draw();
      });
  }
}

export function invokeContextMethod(component, method, ...args) {
  console.log('invokeContextMethod', method);
  let { context } = component.getCache();
  if (context) {
    context[method](...args);
  }
}

export function invokeTemplateContextMethod(component, method, ...args) {
  console.log('invokeContextMethod', method);
  let { templateContext: context } = component.getCache();
  if (context) {
    context[method](...args);
  }
}