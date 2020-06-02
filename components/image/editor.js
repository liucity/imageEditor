import * as helper from './util.js';
import * as utils from '../../utils/util.js';
import MainMenus, { findMenu, SHAPES, COLORS } from './menus/index.js';

const areaSize = 3;

Component({
  options: {
    multipleSlots: true,
    addGlobalClass: true
  },

  properties: {
    url: {
      type: String,
      value: '',
      observer(val){
        this.loadImageInfo(val);
      }
    }
  },

  data: {
    x: 0,
    y: 0,
    scale: 1,
    ready: false,

    imageUrl: 'data:image/png;base64,',
    canvasUrl: 'data:image/png;base64,',
    imageStyles: '',

    menus: MainMenus,
    selectedMenu: {},
    isMovable: true,
    text: {
      show: false,
      focused: false,
      value: '',
      styles: '',
      x: 0,
      y: 0
    },

    mode: '',
    selectedSize: 0,

    colors: COLORS,
    selectedColor: '',

    shapes: Object.keys(SHAPES),
    selectedType: ''
  },

  lifetimes: {
    created(){
      helper.getSystemInfo()
        .then(device => {
          let ratio = 750 / device.windowWidth;
          this.setCache({
            'device': device,
            ratio: ratio,
            width: device.windowWidth,
            height: device.windowHeight - 140 //image-bar高度
          });
        });

      this.handleClickMenu = utils.throttle(this.handleClickMenu, 250);
      this.handleTouchMove = utils.throttle(this.handleTouchMove);
      this.handleTouchChange = utils.debounce(this.handleTouchChange, 50);
      this.handleTouchScale = utils.debounce(this.handleTouchScale, 50);
      this.debounceInvoke = utils.debounce(function(fn, ...args){
        fn.apply(this, args);
      }, 50);

      this.setCache('fixedAreaSize', (areaSize - 1) / 2);
    }
  },

  methods: {
    setCache(key, value){
      console.log('cache', key, value);
      if (!this._cache) this._cache = {};
      let cache = this._cache;
      switch (utils.type(key)) {
        case 'object':
          value = key;
          Object.keys(value).forEach(key => {
            utils.setter(cache, key, value[key]);
          });
          break;
        case 'string':
          utils.setter(cache, key, value);
          break;
      }
    },
    getCache(key) {
      if (!key) return this._cache || {};
      return utils.getter(this._cache || {}, key);
    },
    pushCache(key, value) {
      console.log('pushCache', key, value);
      let values = this.getCache(key);
      if (!values) {
        values = [];
        this.setCache(key, values);
      }
      values.push(value);
    },
    popCache(key) {
      console.log('popCache', key);
      return (this.getCache(key) || []).pop();
    },

    loadImageInfo(url){
      wx.showLoading();
      helper.getImageInfo(url)
        .then(({ width, height, path }) => {
          let cache = this.getCache();
          let styles = {};

          if (width / cache.width > height / cache.height) {
            styles['width'] = cache.width;
            styles['height'] = Math.round(cache.width * height / width);
          } else {
            styles['width'] = Math.round(cache.height * width / height);
            styles['height'] = cache.height;
          }

          this.setCache({
            'imageStyles': styles,
            templateContext: wx.createCanvasContext('templateCanvas', this),
            context: wx.createCanvasContext('coverCanvas', this),
            scale: this.data.scale
          });
          this.setStyles(styles);
          this.setCanvasStyles(styles);
          setTimeout(() => {
            let x = Math.round(cache.width * cache.fixedAreaSize + (cache.width - styles['width']) / 2);
            let y = Math.round(cache.height * cache.fixedAreaSize + (cache.height - styles['height']) / 2);
            this.setData({
              x: x,
              y: y,
              imageUrl: path,
              ready: true
            });
            this.setCache({
              x,
              y
            });
            this.clickMenu('paint');
            wx.hideLoading();
          }, 1000);
        });
    },

    setStyles(styles){
      if (!styles) styles = this.getCache('imageStyles');

      this.setData({
        imageStyles: helper.getStyleString(styles)
      });
    },

    setCanvasStyles(styles){
      if (!styles) styles = this.getCache('canvasStyles');

      this.setData({
        canvasStyles: helper.getStyleString(styles)
      });
    },

    handleTouchStart(e) {
      let current = this.getCache('menu.current');
      if (current && current.touchStart){
        current.touchStart.call(this, e.touches);
      }
    },

    handleTouchMove(e) {
      let current = this.getCache('menu.current');
      if (current && current.touchMove) {
        current.touchMove.call(this, e.touches);
      }
    },

    handleTouchEnd(e){
      let current = this.getCache('menu.current');
      if (current && current.touchEnd) {
        current.touchEnd.call(this, e.touches);
      }
    },

    handleTap(e) {
      let current = this.getCache('menu.current');
      if (current && current.tap) {
        current.tap.call(this, e.touches);
      }
    },

    handleTouchChange({ detail: { x, y, source } }){
      this.setCache({ x, y });
    },

    handleTouchScale({ detail: { x, y, scale } }) {
      this.setCache({ x, y, scale });
    },

    handleSizeChange(e){
      let current = this.getCache('menu.current');
      if (current && current.size){
        current.size.call(this, e.detail.value);
      }
    },

    handleClickColor(e){
      let current = this.getCache('menu.current');
      if (current && current.color) {
        let data = e.currentTarget.dataset;
        let { color } = data;
        current.color.call(this, color);
        this.setData({
          selectedColor: color
        });
      }
    },

    handleClickMenu(e){
      let { name } = e.currentTarget.dataset;
      this.clickMenu(name);
    },

    clickMenu(name) {
      let menu = findMenu(name);

      if (menu.main) {
        let currentMenu = this.getCache('menu.current');
        if (currentMenu && currentMenu.leave) {
          currentMenu.leave.call(this);
        }

        this.setData({
          selectedMenu: menu
        });

        this.setCache({
          'menu.current': menu
        });

        this.setData({
          isMovable: menu.movable !== false
        });

        if (menu.enter)
          menu.enter.call(this);
      } else {
        if (menu.handler)
          menu.handler.call(this);
      }
    },

    handleTextChange(e) {
      let current = this.getCache('menu.current');
      if (current && current.text) {
        current.text.call(this, e.detail.value);
      }
    },

    handleTextTouchChange({ detail: { x, y, source } }) {
      this.setCache({ 
        'text.x': x, 
        'text.y': y
      });
    },

    handleClickType(e) {
      let current = this.getCache('menu.current');
      if (current && current.type) {
        let data = e.currentTarget.dataset;
        let { type } = data;
        current.type.call(this, type);
        this.setData({
          selectedType: type
        });
      }
    },
  }
})
