import * as helper from '../util.js';
import * as methods from './methods.js';

let PaintMenu = {
  name: 'paint', icon: 'paint', label: '画笔', movable: false,
  main: true,
  enter() {
    console.log('paint');
    let area = methods.calcRenderArea(this);
    let { context } = this.getCache();
    let { size = 10, color = '#ed1c24' } = this.getCache('setting.paint') || {};

    this.setData({
      selectedSize: size,
      selectedColor: color
    });

    context.rect(area.sx, area.sy, area.sw, area.sh);
    context.clip();
    context.setLineCap('round');
    context.setLineJoin('round');
    context.setLineWidth(size);
    context.setStrokeStyle(color);
  },
  touchStart(touches) {
    console.log('paint start');
    methods.stackTemplate(this);
    let { x, y, width, height } = this.getCache();
    this.setCache({
      touches: touches
    });
  },
  touchMove(touches) {
    let [touch] = touches;
    let { context, touches: [touchStart], scale } = this.getCache();

    context.beginPath();
    context.moveTo(Math.round(touchStart.x), Math.round(touchStart.y));
    context.lineTo(Math.round(touch.x), Math.round(touch.y));
    context.stroke();
    context.draw(true);

    this.setCache({
      touches: touches
    });
  },
  touchEnd(){
    methods.saveCoverToTemplate(this)
      .then(() => methods.snapTemplate.call(this))
      .then(filePath => {
        this.setData({
          canvasUrl: filePath
        });
        let { context, width, height } = this.getCache();
        context.clearRect(0, 0, width, height); 
        context.draw(true);
      });
  },
  size(val) {
    this.setCache('setting.paint.size', val);
    methods.invokeContextMethod(this, 'setLineWidth', val);
  },
  color(val) {
    this.setCache('setting.paint.color', val);
    methods.invokeContextMethod(this, 'setStrokeStyle', val);
  }
};

export default PaintMenu;