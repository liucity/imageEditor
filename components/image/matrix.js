export default class Matrix{
  constructor(params){
    if(params instanceof Matrix){
      this.setMatrix(params);
    }
  }

  setMatrix(matrix){
    Object.assign(this, matrix);
  }

  set(key, value){
    this[key] = value;
  }

  toString(){
    return `matrix(${this.a.toFixed(2)}, ${this.b.toFixed(2)}, ${this.c.toFixed(2)}, ${this.d.toFixed(2)}, ${Math.round(this.e)}, ${Math.round(this.f)})`
  }

  a = 1
  b = 0
  c = 0
  d = 1
  e = 0
  f = 0
}