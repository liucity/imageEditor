import { getImageInfo } from './util';

Component({
  data: {
    width: 1,
    height: 1
  },

  methods: {
    setSize(width, height){
      let maxWidth = 750;
      let maxHeight = 1334;

      if(width / maxWidth > height / maxHeight){
        if(width > maxWidth){
          height = height / width * maxWidth;
          width = maxWidth;
        }
      } else {
        if(height > maxHeight) {
          width = width / height * maxHeight;
          height = maxHeight;
        }
      }

      return new Promise((res) => {
        this.setData({
          width,
          height
        }, () => {
          setTimeout(res, 50);
        });
      });
    },

    compress(...files){
      let promise = Promise.resolve();
      let results = [];

      console.log('compress')
      files.forEach((file, i) => {
        promise = promise.then(() => {
          return this.run(file)
            .then(path => results[i] = path);
        });
      })

      return promise
        .then(() => results);
    },

    run(file){
      return getImageInfo(file)
        .then((rst) => {
          return this.setSize(rst.width, rst.height);
        })
        .then(() => {
          // let ratio = 2;
          let { width, height } = this.data;

          let ctx = wx.createCanvasContext('compressCanvas', this);
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(file, 0, 0, width, height);
         
          return new Promise((resolve) => {
            ctx.draw(false, () => {
              wx.canvasToTempFilePath({
                canvasId: 'compressCanvas',
                destWidth: width,
                destHeight: height,
                // quality: 1,
                fileType: 'jpg',
                success: (res) => {
                  resolve(res.tempFilePath);
                }
              }, this);
            });
          });
        });
    }
  }
})
