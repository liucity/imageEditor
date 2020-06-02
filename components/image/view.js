import * as utils from '../../utils/util.js';
import Matrix from './matrix';
import Origin from './origin';

let getStyleString = (styles) => {
  return Object.keys(styles)
    .map(key => `${key}: ${isNaN(styles[key]) ? styles[key] : Math.round(styles[key]) + 'px'}; `)
    .join('');
}

let avg = (...nums) => {
  if(!nums.length) return 0;
  return nums.reduce((total, num) => total + num, 0) / nums.length;
}

let getDistance = (p1, p2) => Math.sqrt(Math.pow(p1.pageX - p2.pageX, 2), Math.pow(p1.pageY - p2.pageY, 2));

let getRange = (total, origin, scale, size) => {
  let rangeStart = total - (origin + scale - origin * scale) * size;
  let rangeEnd = (scale - 1) * origin * size;
  return rangeStart > rangeEnd ? [rangeEnd, rangeStart] : [rangeStart, rangeEnd];
}

let limitMatrix = (matrix, key, min, max) => {
  let value = matrix[key];
  if(!isNaN(min)) value = Math.max(value, min);
  if(!isNaN(max)) value = Math.min(value, max);
  matrix[key] = value;
}

Component({
  properties: {
    src: {
      type: String
    },
    fillBox: {
      type: Boolean,
      value: true
    },
    //锁定宽高比
    fixedRatio: {
      type: Boolean,
      value: false
    },
    //灵明度
    sensitivity: {
      type: Number,
      value: 1
    },
    //最大缩放
    maxScale: {
      type: Number,
      value: 3
    },
    //最小缩放
    minScale: {
      type: Number,
      value: .5
    },
    //限制在可移动范围 todo
    limitInBox: {
      type: Boolean,
      value: true
    }
  },

  data: {
    imageStyles: ''
  },

  methods: {
    //set cache data，for improving performance 
    setCache(key, value) {
      // console.log('cache', key, value);
      if (!this._cache) this._cache = {};
      let cache = this._cache;
      switch (utils.type(key)) {
        case 'object':
          value = key;
          Object.keys(value).forEach(key => {
            cache[key] = value[key];
          });
          break;
        case 'string':
          cache[key] = value;
          break;
      }
    },
    getCache(key) {
      if (!key) return this._cache || {};
      return utils.getter(this._cache || {}, key);
    },
    //convert style obj to css
    setStyles(styles){
      this.setData({
        imageStyles: getStyleString(styles)
      });
      // console.log('setStyles', this.data.imageStyles);
    },

    //on image loaded, init width, height and default infos
    handleImageLoaded(e){
      let { width, height } = e.detail;

      this.createSelectorQuery().select('.image-view')
        .boundingClientRect(({ width: boxWidth, height: boxHeight }) => {
          let matrix = new Matrix();
          let origin = new Origin();

          if(this.data.fillBox){
            if (width / boxWidth > height / boxHeight) {
              width = Math.round(boxHeight * width / height);
              height = boxHeight;
            } else {
              height = Math.round(boxWidth * height / width);
              width = boxWidth;
            }
          } else {
            if (width / boxWidth > height / boxHeight) {
              height = Math.round(boxWidth * height / width);
              width = boxWidth;
            } else {
              width = Math.round(boxHeight * width / height);
              height = boxHeight;
            }

            matrix.set('e', (boxWidth - width) / 2);
            matrix.set('f', (boxHeight - height) / 2);
          }
    
          this.setStyles({
            width,
            height,
            transform: origin.getTransform(matrix, width, height),
            'transform-origin': origin.toString()
          });

          this.setCache({
            ready: true,
            width, 
            height,
            matrix,
            origin,
            boxWidth,
            boxHeight
          });
        }).exec();

      this.handleTouchMove = utils.throttle(this.handleTouchMove, 40);
    },

    //touch begin, init origin point
    handleTouchStart(e){
      let { width, height, ready, matrix, origin } = this.getCache();
      let { touches } = e;
      if(!ready) return;
      let _origin = new Origin(origin);
      
      let x = (1 - matrix.a) * origin.x * width + matrix.e;
      let y = (1 - matrix.d) * origin.y * height + matrix.f;
      _origin.set('x', (avg(...touches.map(t => t.pageX)) - x)/ matrix.a / width);
      _origin.set('y', (avg(...touches.map(t => t.pageY)) - y)/ matrix.d / height);
      let _matrix = _origin.fixMatrix(new Matrix(matrix), width, height);
      // console.log(x, matrix.e, _origin.x, _matrix.e);

      this.setCache({
        'touches': touches,
        origin: _origin,
        matrix: _matrix
      });

      if(touches.length > 1) {
        // let xMinPointIndex = touches[0].pageX > touches[1].pageX ? 1 : 0;
        // let xMaxPointIndex = xMinPointIndex ? 0 : 1;
        // let getXBasis = (ps) => ps[xMaxPointIndex].pageX - ps[xMinPointIndex].pageX;

        // let yMinPointIndex = touches[0].pageY > touches[1].pageY ? 1 : 0;
        // let yMaxPointIndex = yMinPointIndex ? 0 : 1;
        // let getYBasis = (ps) => ps[yMaxPointIndex].pageY - ps[yMinPointIndex].pageY;

        // this.setCache({
        //   getXBasis,
        //   getYBasis,
        //   startXBasis: getXBasis(touches),
        //   startYBasis: getYBasis(touches)
        // });
        this.setCache({
          distance: getDistance(...touches)
        });
      }
    },
    handleTouchMove(e) {
      let { touches } = e;
      let cache = this.getCache();
      let { width, height, ready, matrix, origin, touches: startTouches } = cache;
      if(!ready || touches.length !== startTouches.length) return;

      let _matrix = new Matrix(matrix);

      if(touches.length === 1){
        let [current] = touches;
        let [start] = startTouches;
        _matrix.set('e', _matrix.e + current.pageX - start.pageX);
        _matrix.set('f', _matrix.f + current.pageY - start.pageY);
      } else {
        let { sensitivity, fixedRatio } = this.data;
        let { distance } = cache;
        // let { getXBasis, getYBasis, startXBasis, startYBasis } = cache;

        // let xBasis = Math.abs(getXBasis(touches) - startXBasis) / width * sensitivity;
        // let yBasis = Math.abs(getYBasis(touches) - startYBasis) / height * sensitivity;
        // if(fixedRatio){
        //   xBasis = yBasis = Math.abs(xBasis) > Math.abs(yBasis) ? xBasis : yBasis;
        // }

        let disDiff = getDistance(...touches) - distance;
        let xBasis = disDiff / width * sensitivity;
        let yBasis = disDiff / height * sensitivity;
        if(fixedRatio){
          xBasis = yBasis = Math.abs(xBasis) > Math.abs(yBasis) ? xBasis : yBasis;
        }
        
        let xScale = matrix.a + xBasis;
        let yScale = matrix.d + yBasis;

        _matrix.set('a', xScale);
        _matrix.set('d', yScale);
      }

      this.setCache('lastMatrix', _matrix);

      this.setStyles({
        width,
        height,
        transform: _matrix.toString(),
        'transform-origin': origin.toString()
      });
    },
    handleTouchEnd(e) {
      let cache = this.getCache();
      let {lastMatrix: _matrix } = cache;
      
      if(_matrix){
        let { width, height, origin, boxWidth, boxHeight } = cache;
        let { minScale, maxScale } = this.data;

        limitMatrix(_matrix, 'a', minScale, maxScale);
        limitMatrix(_matrix, 'd', minScale, maxScale);

        let [wMin, wMax] = getRange(boxWidth, origin.x, _matrix.a, width);
        if(_matrix.a){
          limitMatrix(_matrix, 'e', wMin, wMax);
        } else {
          let w = _matrix.a * width;
          limitMatrix(_matrix, 'e', max - w, min + w);
        }

        let [yMin, yMax] = getRange(boxHeight, origin.y, _matrix.d, height);
        if(_matrix.d){
          limitMatrix(_matrix, 'f', yMin, yMax);
        } else {
          let h = _matrix.d * height;
          limitMatrix(_matrix, 'f', max - h, min + h);
        }

        this.setCache('matrix', _matrix);

        this.setStyles({
          width,
          height,
          transform: _matrix.toString(),
          'transform-origin': origin.toString()
        });
      }
    }
  }
})
