import encode from './base64.js';
import iconData from './iconData.js';

Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    icon: {
      type: String,
      value: '',
      observer: '_genSrc'
    },
    size: {
      type: Number,
      value: 50
    },
    color: {
      type: String,
      value: '#000000'
    }
  },
  data: {
    src: ''
  },
  methods: {
    _genSrc: function _genSrc(v) {
      let rawData = iconData[v];
      let { color } = this.properties;
      if (!rawData) return;
      var base64 = encode(rawData.replace(/fill:\s*(currentColor|[a-zA-Z0-9]{0,6})/, `fill:${color}`));
      this.setData({
        src: 'data:image/svg+xml;base64,' + base64
      });
    }
  }
});

