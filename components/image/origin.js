export default class Origin {
  constructor(params){
    if(params instanceof Origin) {
      this.oldOrigin = params;
    }
  }

  set(key, value){
    this[key] = value;
  }

  fixMatrix(matrix, w, h){
    if(!matrix) return matrix;
    let { a, d, e, f } = matrix;
    let { x = .5, y = .5 } = this.oldOrigin || {};
    matrix.e = e + (x - this.x) * (1 - a) * w;
    matrix.f = f + (y - this.y) * (1 - d) * h;

    return matrix;
  }

  getTransform(matrix, w, h){
    if(!matrix) return '';
    let { a, b, c, d, e, f } = matrix;
    let { x = .5, y = .5 } = this.oldOrigin || {};
    let ne = e + (x - this.x) * (1 - a) * w;
    let nf = f + (y - this.y) * (1 - d) * h;

    return `matrix(${a.toFixed(2)}, ${b.toFixed(2)}, ${c.toFixed(2)}, ${d.toFixed(2)}, ${Math.round(ne)}, ${Math.round(nf)})`
  }

  toString(){
    return `${Math.round(this.x * 100)}% ${Math.round(this.y * 100)}%`
  }

  x = .5  //number 50%
  y = .5  //number 50%
}