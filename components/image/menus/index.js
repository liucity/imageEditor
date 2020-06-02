import * as helper from '../util.js';
import * as methods from './methods.js';
import TextMenu from './text.js';
import PaintMenu from './paint.js';
import ShapMenu from './shape.js';

export { SHAPES } from './shape.js';
export const COLORS = ['#c3c3c3', '#ffffff', '#000000', '#ed1c24', '#ff7f27', '#fff200', '#22b14c', '#00a2e8', '#ffaec9', '#a349a4'];

export function findMenu(name) {
  let menu;
  let walker = (menus) => {
    for (let child of menus) {
      if (menu) break;
      if (child.name === name) {
        menu = child;
        break;
      }
      if (Array.isArray(child.children)) {
        walker(child.children);
      }
    }
  }

  walker(MainMenus);

  return menu;
}

const MainMenus = [
  {
    name: 'undo', icon: 'undo', label: '撤销', disabled: true,
    handler: methods.undoTemplate
  },
  PaintMenu,
  ShapMenu,
  TextMenu,
  {
    name: 'save', label: '完成',
    handler() {
      console.log('save')
      let { templateContext: context, imageStyles: { width, height } } = this.getCache();
      context.drawImage(this.data.imageUrl, 0, 0, width, height);
      context.drawImage(this.data.canvasUrl, 0, 0, width, height);

      return new Promise(res => {
          context.draw(false, res);
        })
        .then(() => methods.snapTemplate.call(this))
        .then(filePath => {
          this.triggerEvent('save', {
            filePath: filePath
          });
        });
    }
  }
]

export default MainMenus;