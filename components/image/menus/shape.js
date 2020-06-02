import * as helper from '../util.js';
import * as methods from './methods.js';

export const SHAPES = {
  'close': (context, x, y, size) => {
    context.beginPath();
    context.moveTo(x - size / 2, y - size / 2);
    context.lineTo(x + size / 2, y + size / 2);
    context.stroke();
    context.moveTo(x - size / 2, y + size / 2);
    context.lineTo(x + size / 2, y - size / 2);
    context.stroke();
  },
  'correct': (context, x, y, size) => {
    context.beginPath();
    context.moveTo(x - size / 2, y);
    context.lineTo(x, y + size / 2);
    context.lineTo(x + size, y - size / 2);
    context.stroke();
  }
}

let ShapeMenu = {
  name: 'shape', icon: 'shape', label: '图形',
  main: true,
  enter() {
    console.log('shape')
    let { templateContext: context } = this.getCache();
    let { size = 10, color = '#ed1c24', type = 'close' } = this.getCache('setting.shape') || {};

    this.setData({
      mode: 'type',
      selectedColor: color,
      selectedSize: size,
      selectedType: type
    });

    context.setLineCap('round');
    context.setLineJoin('round');
    context.setLineWidth(size / 2);
    context.setStrokeStyle(color);
  },
  tap(touches) {
    console.log('shape tap');
    let {
      templateContext: context,
      width: screenW, height: screenH, imageStyles: { width, height },
      x, y, scale, fixedAreaSize
    } = this.getCache();
    let fixedX = x - screenW * fixedAreaSize - width * (scale - 1) / 2;
    let fixedY = y - screenH * fixedAreaSize - height * (scale - 1) / 2;
    let { size = 10, type = 'close' } = this.getCache('setting.shape') || {};

    methods.stackTemplate(this);

    touches.forEach(({ pageX, pageY }) => {
      let px = (pageX - fixedX) / scale;
      let py = (pageY - fixedY) / scale;
      SHAPES[type](context, Math.round(px), Math.round(py), size);
    });

    context.draw(true, () => {
      methods.snapTemplate.call(this)
        .then(filePath => {
          this.setData({
            canvasUrl: filePath
          });
        });
    });
  },
  size(val) {
    this.setCache('setting.shape.size', val);
    methods.invokeTemplateContextMethod(this, 'setLineWidth', val / 2);
  },
  color(val) {
    this.setCache('setting.shape.color', val);
    methods.invokeTemplateContextMethod(this, 'setStrokeStyle', val);
  },
  type(val) {
    this.setCache('setting.shape.type', val);
  },
  leave(){
    this.setData({
      mode: ''
    });
  }
}

export default ShapeMenu;