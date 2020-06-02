import * as helper from '../util.js';
import * as methods from './methods.js';

let TextMenu = {
  name: 'text', icon: 'text', label: '文字',
  main: true,
  enter() {
    console.log('text')
    let { size = 10, color = '#ed1c24' } = this.getCache('setting.shape') || {};

    this.setData({
      selectedColor: color,
      selectedSize: size
    });

    TextMenu.startText.call(this);
  },
  getStyles() {
    let { value = '' } = this.getCache('text') || {};
    let { size = 10, color = '#ed1c24' } = this.getCache('setting.text') || {};

    return helper.getStyleString({
      width: Math.max(value.length, 10) * size * .6,
      height: Math.max(size * 3 / 2, 30),
      'line-height': Math.max(size * 3 / 2, 30),
      color,
      'border-color': color,
      'font-size': size
    });
  },
  text(val) {
    this.setCache('text.value', val);
    this.setData({
      'text.styles': TextMenu.getStyles.call(this)
    });
  },
  size(val) {
    this.setCache('setting.text.size', val);
    this.setData({
      'text.styles': TextMenu.getStyles.call(this)
    });
  },
  color(val) {
    this.setCache('setting.text.color', val);
    this.setData({
      'text.styles': TextMenu.getStyles.call(this)
    });
  },
  leave() {
    TextMenu.drawTextToTemplate.call(this);
    this.setData({
      'text.show': false,
      'text:focus': false
    });
  },
  startText(){
    let { width, height, fixedAreaSize } = this.getCache();
    let area = methods.calcRenderArea(this);

    let x = Math.round(area.sx + area.sw / 2 + width * fixedAreaSize);
    let y = Math.round(area.sy + area.sh / 2 + height * fixedAreaSize);

    this.setCache('text', {
      x: x,
      y: y,
      value: ''
    });

    this.setData({
      text: {
        show: true,
        focus: true,
        value: '',
        styles: TextMenu.getStyles.call(this),
        x: x,
        y: y
      }
    });
  },
  drawTextToTemplate(){
    let { x, y, value } = this.getCache('text') || {};
    let { size = 10, color = '#ed1c24' } = this.getCache('setting.text') || {};
    let {
      templateContext: context,
      x: cx, y: cy, scale
    } = this.getCache();
    methods.stackTemplate(this);
    let area = methods.calcRenderArea(this);

    context.font = 'sans-serif';
    context.setTextBaseline('middle');
    context.setFillStyle(color);
    context.setFontSize(size);
    
    if (!value) {
      return Promise.resolve();
    }

    let fixedX = (x - cx) / scale;
    let fixedY = (y + Math.max(size * 3 / 2, 30) / 2 - cy) / scale;
    context.fillText(value, Math.round(fixedX), Math.round(fixedY));

    return new Promise(res => context.draw(true, res))
      .then(() => {
        methods.snapTemplate.call(this)
          .then(filePath => {
            this.setData({
              canvasUrl: filePath
            });
          });
      });
  }
}

export default TextMenu;