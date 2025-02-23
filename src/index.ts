let cacheIndex = 0;
let cachedPixelBits: number[][][] = [];
const cacheIndexProperty = "_ppcCacheIndex";

let options: Options = {
  pixelTestFunction: (r, g, b, a) => r + g + b > 0 && a > 0
};

export function setOptions(_options: Options) {
  forOwn(_options, (v, k) => {
    options[k] = v;
  });
}

export class Collider {
  private pos = { x: 0, y: 0 };
  private anchor = { x: 0, y: 0 };
  private size = { x: 0, y: 0 };
  private pixelBits: number[][] = [];
  private isPositionSet = false;

  constructor(image: HTMLImageElement | ImageData, useCaching: boolean = true) {
    this.size.x = image.width;
    this.size.y = image.height;
    if (useCaching && cacheIndexProperty in image) {
      this.pixelBits = cachedPixelBits[<any> image[cacheIndexProperty]];
      return;
    }
    let pixelData: Uint8ClampedArray;
    if ((<ImageData> image).data) {
      pixelData = (<ImageData> image).data;
    } else {
      const canvas = document.createElement("canvas");
      canvas.width = this.size.x;
      canvas.height = this.size.y;
      const context = canvas.getContext("2d");
      context.drawImage(<HTMLImageElement> image, 0, 0);
      pixelData = context.getImageData(0, 0, this.size.x, this.size.y).data;
    }
    let pdIndex = 0;
    for (let y = 0; y < this.size.y; y++) {
      let bits = [];
      let bit = 0;
      let nextBit = (1 << 31) >>> 0;
      for (let x = 0; x < this.size.x; x++) {
        if (
          options.pixelTestFunction(
            pixelData[pdIndex],
            pixelData[pdIndex + 1],
            pixelData[pdIndex + 2],
            pixelData[pdIndex + 3]
          )
        ) {
          bit |= nextBit;
        }
        nextBit >>>= 1;
        if (nextBit <= 0) {
          bits.push(bit);
          nextBit = (1 << 31) >>> 0;
          bit = 0;
        }
        pdIndex += 4;
      }
      if (nextBit < (1 << 31) >>> 0) {
        bits.push(bit);
      }
      this.pixelBits.push(bits);
    }
    if (useCaching) {
      cachedPixelBits.push(this.pixelBits);
      (image as any)[cacheIndexProperty] = cacheIndex;
      cacheIndex++;
    }
  }

  setPos(x: number, y: number) {
    this.pos.x = Math.floor(x - this.size.x * this.anchor.x);
    this.pos.y = Math.floor(y - this.size.y * this.anchor.y);
    this.isPositionSet = true;
  }

  setAnchor(x: number, y: number) {
    this.anchor.x = x;
    this.anchor.y = y;
  }

  test(other: Collider) {
    if (!this.isPositionSet || !other.isPositionSet) {
      return false;
    }
    const offset = { x: other.pos.x - this.pos.x, y: other.pos.y - this.pos.y };
    if (
      offset.x < -other.size.x ||
      offset.x > this.size.x ||
      offset.y < -other.size.y ||
      offset.y > this.size.y
    ) {
      return false;
    }
    const sx = offset.x > 0 ? offset.x : 0;
    const sy = offset.y > 0 ? offset.y : 0;
    const sox = offset.x > 0 ? 0 : -offset.x;
    const soy = offset.y > 0 ? 0 : -offset.y;
    for (let y = sy, oy = soy; y < this.size.y; y++, oy++) {
      if (oy >= other.size.y) {
        break;
      }
      for (let x = sx, ox = sox; x < this.size.x; x += 32, ox += 32) {
        if (ox >= other.size.x) {
          break;
        }
        let tb = createBit(this.pixelBits[y], x);
        let ob = createBit(other.pixelBits[oy], ox);
        if ((tb & ob) > 0) {
          return true;
        }
      }
    }
    return false;
  }
}

export function clearCache() {
  cacheIndex = 0;
  cachedPixelBits = [];
}

function createBit(bits: number[], x) {
  const xm = x % 32;
  const xi = Math.floor(x / 32);
  if (xm === 0) {
    return getBit(bits, xi);
  }
  return (
    ((getBit(bits, xi) << xm) >>> 0) | (getBit(bits, xi + 1) >>> (32 - xm))
  );
}

function getBit(bits: number[], i) {
  return i < 0 || i >= bits.length ? 0 : bits[i];
}

function forOwn(obj: any, func: Function) {
  for (let p in obj) {
    func(obj[p], p);
  }
}

export interface Options {
  pixelTestFunction: (r: number, g: number, b: number, a: number) => boolean;
}
