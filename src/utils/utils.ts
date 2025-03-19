import type { IDomSize, IImageInfo, IDrawCanvasInfo, ICompressResult } from '@/types/IType';
import {
  CANVAS_RENDER_MAX_WIDTH,
  CANVAS_RENDER_MAX_HEIGHT,
  CANVAS_RENDER_MIN_WIDTH,
  CANVAS_RENDER_MIN_HEIGHT,
  DEFAULT_RESULT_IMAGE_FORMAT,
  MAX_UPLOAD_IMAGE_SIZE
} from '@/config/constants';
import { loadImageSource } from '@/utils/compressImage';

/**
 * 生成唯一的作用域 ID
 */
export function generateScopeId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Check if the given value is a number.
 * @param {*} value - The value to check.
 * @returns {boolean} Returns `true` if the given value is a number, else `false`.
 */
export function isNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * 给 HTML 模板添加作用域属性
 */
export function scopeTemplate(template: string, scopeId: string): string {
  return template.replace(/<[^>]+>/g, (match) => {
    if (match.includes('data-style-id')) return match;
    return match.replace(/>/, ` data-style-id="${scopeId}">`);
  });
}

/**
 * 给 CSS 添加作用域选择器
 */
export function scopeStyles(styles: string, scopeId: string): string {
  return styles.replace(/\.photo-studio-container/g,
    `.photo-studio-container[data-style-id="${scopeId}"]`);
}

/**
 * 添加元素的 class
 * @param {Element} element - 目标元素
 * @param {string | string[]} value - 要添加的 class
 */
export function addClass(element: Element | Element[], value: string | string[]) {
  if (!value) {
    return;
  }

  if (Array.isArray(element) && isNumber(element.length)) {
    element.forEach((elem) => {
      addClass(elem, value);
    });
    return;
  }

  const values = Array.isArray(value) ? value : [value];

  if ((element as Element)?.classList) {
    (element as Element).classList.add(...values);
    return;
  }

  const className = (element as Element)?.className.trim();
  const newClasses = values.filter(v => !className.includes(v));

  if (!className) {
    (element as Element).className = newClasses.join(' ');
  } else if (newClasses.length) {
    (element as Element).className = `${className} ${newClasses.join(' ')}`;
  }
}

/**
 * 移除元素的 class
 * @param {Element} element - 目标元素
 * @param {string | string[]} value - 要移除的 class
 */
export function removeClass(element: Element | Element[], value: string | string[]) {
  if (!value) {
    return;
  }

  if (Array.isArray(element) && isNumber(element.length)) {
    element.forEach((elem) => {
      removeClass(elem, value);
    });
    return;
  }

  const values = Array.isArray(value) ? value : [value];

  if ((element as Element)?.classList) {
    (element as Element).classList.remove(...values);
    return;
  }

  let className = (element as Element).className;
  values.forEach(v => {
    if (className.indexOf(v) >= 0) {
      className = className.replace(v, '').trim();
    }
  });
  (element as Element).className = className;
}

/**
 * 设置元素的样式
 */
export function setStyle(element: Element, styles: Record<string, any>) {
  const elem = element as HTMLElement;
  Object.keys(styles).forEach((property: any) => {
    elem.style[property] = styles[property];
  });
}

/**
 * 复制 canvas
 * @param canvas 原始 canvas
 * @returns 复制后的 canvas
 */
export function copyCanvas(canvas: HTMLCanvasElement) {
  const canvas2 = document.createElement('canvas');
  canvas2.width = canvas.width;
  canvas2.height = canvas.height;
  canvas2.getContext('2d')?.drawImage(canvas, 0, 0);
  return canvas2;
}

/**
   * 
   * @param domSize dom 的宽高
   * @param width 图片的宽度
   * @param height 图片的高度
   * @returns 计算后的图片尺寸
   */
export function calculateDimensions(domSize: IDomSize, width: number, height: number): IImageInfo {
  let imageWidth = width;
  let imageHeight = height;

  // 如果图片尺寸超过最大限制，需要等比例缩放
  if (width > CANVAS_RENDER_MAX_WIDTH || height > CANVAS_RENDER_MAX_HEIGHT) {
    const widthRatio = CANVAS_RENDER_MAX_WIDTH / width;
    const heightRatio = CANVAS_RENDER_MAX_HEIGHT / height;

    // 使用较小的缩放比例，确保宽高都不超过最大限制
    const ratio = Math.min(widthRatio, heightRatio);

    imageWidth = round(width * ratio);
    imageHeight = round(height * ratio);
  }

  // canvas 尺寸与计算后的图片尺寸保持一致
  const canvasWidth = imageWidth;
  const canvasHeight = imageHeight;

    // 计算 style 尺寸
  let styleWidth = domSize.width;
  let styleHeight = domSize.height;
  
  // 计算图片在 domSize 范围内的等比例尺寸
  const domWidthRatio = domSize.width / imageWidth;
  const domHeightRatio = domSize.height / imageHeight;
  
  if (domWidthRatio < domHeightRatio) {
    // 如果宽度比例小，说明宽度会先触及边界
    styleWidth = domSize.width;
    styleHeight = round(imageHeight * domWidthRatio);
  } else {
    // 如果高度比例小，说明高度会先触及边界
    styleHeight = domSize.height;
    styleWidth = round(imageWidth * domHeightRatio);
  }

  return {
    canvasWidth,
    canvasHeight,
    styleWidth,
    styleHeight
  };
}

/** 四舍五入，保留小数点后指定位数，默认 4 位 */
export function round(value: number, digits: number = 9): number {
  if (digits === 0) {
    return Math.round(value);
  }
  const pow = Math.pow(10, digits);
  return Math.round(value * pow) / pow;
}

/**
 * 计算裁剪比例
 * @param nowCurrentStep 当前步骤
 * @param nowCropRatio 裁剪比例
 * @param originalRatio 原始比例
 * @returns 裁剪后的步骤
 */
export function calculateCropRatio(
  nowCurrentStep: IDrawCanvasInfo,
  nowCropRatio: number,
  originalRatio: number
): IDrawCanvasInfo {
  if (nowCurrentStep.direction === 'vertical') {
    // 竖屏状态下，比较高宽比
    if (nowCropRatio >= originalRatio) {
      /** 裁剪比例大于等于原比例，则裁剪宽度 */
      nowCurrentStep.dWidth = round(nowCurrentStep.dHeight / nowCropRatio);
      nowCurrentStep.domWidth = round(nowCurrentStep.currentDomHeight / nowCropRatio);
      nowCurrentStep.sWidth = round(nowCurrentStep.sHeight / nowCropRatio);

      /** 计算允许的最大宽度 */
      const allowMoveMaxWidth = nowCurrentStep.rawDomWidth;

      /** 确保宽度不超过限制 */
      if (nowCurrentStep.domWidth > allowMoveMaxWidth) {
        nowCurrentStep.domWidth = allowMoveMaxWidth;
        nowCurrentStep.dWidth = round(nowCurrentStep.domWidth / nowCurrentStep.cdProportions!);
        nowCurrentStep.sWidth = round(nowCurrentStep.dWidth * nowCurrentStep.proportion!);
      }

      /** 计算水平方向的偏移量 */
      const maxXOffset = allowMoveMaxWidth - nowCurrentStep.domWidth;
      nowCurrentStep.xDomOffset = round(maxXOffset / 2);
      nowCurrentStep.sx = round((nowCurrentStep.xDomOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);

      /** 确保偏移量在合理范围内 */
      if (nowCurrentStep.xDomOffset < 0) {
        nowCurrentStep.xDomOffset = 0;
        nowCurrentStep.sx = 0;
      } else if (nowCurrentStep.xDomOffset > maxXOffset) {
        nowCurrentStep.xDomOffset = maxXOffset;
        nowCurrentStep.sx = round((maxXOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);
      }
    } else {
      /** 裁剪比例小于原比例，则裁剪高度 */
      nowCurrentStep.dHeight = round(nowCurrentStep.dWidth * nowCropRatio);
      nowCurrentStep.currentDomHeight = round(nowCurrentStep.currentDomWidth * nowCropRatio);
      nowCurrentStep.sHeight = round(nowCurrentStep.sWidth * nowCropRatio);

      /** 计算允许的最大高度 */
      const allowMoveMaxHeight = nowCurrentStep.rawDomHeight;

      /** 确保高度不超过限制 */
      if (nowCurrentStep.currentDomHeight > allowMoveMaxHeight) {
        nowCurrentStep.currentDomHeight = allowMoveMaxHeight;
        nowCurrentStep.dHeight = round(nowCurrentStep.currentDomHeight / nowCurrentStep.cdProportions!);
        nowCurrentStep.sHeight = round(nowCurrentStep.dHeight * nowCurrentStep.proportion!);
      }

      /** 计算垂直方向的偏移量 */
      const maxYOffset = allowMoveMaxHeight - nowCurrentStep.currentDomHeight;
      nowCurrentStep.yDomOffset = round(maxYOffset / 2);
      nowCurrentStep.sy = round((nowCurrentStep.yDomOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);

      /** 确保偏移量在合理范围内 */
      if (nowCurrentStep.yDomOffset < 0) {
        nowCurrentStep.yDomOffset = 0;
        nowCurrentStep.sy = 0;
      } else if (nowCurrentStep.yDomOffset > maxYOffset) {
        nowCurrentStep.yDomOffset = maxYOffset;
        nowCurrentStep.sy = round((maxYOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);
      }
    }
  } else {
    // 横屏状态下，比较宽高比
    if (nowCropRatio >= originalRatio) {
      /** 裁剪比例大于等于原比例，则裁剪高度 */
      nowCurrentStep.dHeight = round(nowCurrentStep.dWidth / nowCropRatio);
      nowCurrentStep.domHeight = round(nowCurrentStep.currentDomHeight / nowCropRatio);
      nowCurrentStep.sHeight = round(nowCurrentStep.sWidth / nowCropRatio);

      /** 计算允许的最大高度 */
      const allowMoveMaxHeight = nowCurrentStep.rawDomHeight;

      /** 确保高度不超过限制 */
      if (nowCurrentStep.domHeight > allowMoveMaxHeight) {
        nowCurrentStep.domHeight = allowMoveMaxHeight;
        nowCurrentStep.dHeight = round(nowCurrentStep.domHeight / nowCurrentStep.cdProportions!);
        nowCurrentStep.sHeight = round(nowCurrentStep.dHeight * nowCurrentStep.proportion!);
      }

      /** 计算垂直方向的偏移量 */
      const maxYOffset = allowMoveMaxHeight - nowCurrentStep.domHeight;
      nowCurrentStep.yDomOffset = round(maxYOffset / 2);
      nowCurrentStep.sy = round((nowCurrentStep.yDomOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);

      /** 确保偏移量在合理范围内 */
      if (nowCurrentStep.yDomOffset < 0) {
        nowCurrentStep.yDomOffset = 0;
        nowCurrentStep.sy = 0;
      } else if (nowCurrentStep.yDomOffset > maxYOffset) {
        nowCurrentStep.yDomOffset = maxYOffset;
        nowCurrentStep.sy = round((maxYOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);
      }
    } else {
      /** 裁剪比例小于原比例，则裁剪宽度 */
      nowCurrentStep.dWidth = round(nowCurrentStep.dHeight * nowCropRatio);
      nowCurrentStep.domWidth = round(nowCurrentStep.currentDomHeight * nowCropRatio);
      nowCurrentStep.sWidth = round(nowCurrentStep.sHeight * nowCropRatio);

      /** 计算允许的最大宽度 */
      const allowMoveMaxWidth = nowCurrentStep.rawDomWidth;

      /** 确保宽度不超过限制 */
      if (nowCurrentStep.domWidth > allowMoveMaxWidth) {
        nowCurrentStep.domWidth = allowMoveMaxWidth;
        nowCurrentStep.dWidth = round(nowCurrentStep.domWidth / nowCurrentStep.cdProportions!);
        nowCurrentStep.sWidth = round(nowCurrentStep.dWidth * nowCurrentStep.proportion!);
      }

      /** 计算水平方向的偏移量 */
      const maxXOffset = allowMoveMaxWidth - nowCurrentStep.domWidth;
      nowCurrentStep.xDomOffset = round(maxXOffset / 2);
      nowCurrentStep.sx = round((nowCurrentStep.xDomOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);

      /** 确保偏移量在合理范围内 */
      if (nowCurrentStep.xDomOffset < 0) {
        nowCurrentStep.xDomOffset = 0;
        nowCurrentStep.sx = 0;
      } else if (nowCurrentStep.xDomOffset > maxXOffset) {
        nowCurrentStep.xDomOffset = maxXOffset;
        nowCurrentStep.sx = round((maxXOffset / nowCurrentStep.cdProportions!) * nowCurrentStep.proportion!);
      }
    }
  }
  return nowCurrentStep
}

/**
 * 图片源类型
 */
type ImageSource = File | string;

/**
 * 压缩图片并转换为base64格式
 * @param source - 图片文件或URL链接
 * @param options - 压缩选项
 * @returns 返回压缩后的结果，包含base64字符串和图片尺寸
 */
export async function compressImage(
  source: ImageSource, 
  options?: {
    mimeType?: string;
    quality?: number;
  }
): Promise<ICompressResult> {
  try {
    /** 加载并压缩图片 */
    return await loadImageSource(source, {
      maxSizeMB: MAX_UPLOAD_IMAGE_SIZE,
      minQuality: options?.quality ?? 0.1
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error)
      throw new Error(`图片压缩失败: ${error.message}`);
    }
    throw new Error('图片压缩失败: 未知错误');
  }
}

/**
 * 计算图片缩放后的尺寸和偏移量
 */
export function calculateImageZoom(step: IDrawCanvasInfo, zoom: number, mouseX: number, mouseY: number) {
  let {
    rawDomHeight,
    rawDomWidth,
    currentDomHeight,
    currentDomWidth,
    cropBoxHeight,
    cropBoxWidth,
    rawAspectRatio
  } = step

  /** 缩放后最新的尺寸 */
  let scaledWidth = Math.round(rawDomWidth * (zoom ?? 1));
  let scaledHeight = Math.round(rawDomHeight * (zoom ?? 1));

  /** 当缩放后的宽度小于裁剪框体的宽度时，将宽度设置为裁剪框体的宽度，并计算高度 */
  if (scaledWidth < cropBoxWidth) {
    scaledWidth = cropBoxWidth
    scaledHeight = Math.round(scaledWidth / rawAspectRatio!)
  }
  /** 当缩放后的高度小于裁剪框体的高度时，将高度设置为裁剪框体的高度，并计算宽度 */
  if (scaledHeight < cropBoxHeight) {
    scaledHeight = cropBoxHeight
    scaledWidth = Math.round(scaledHeight * rawAspectRatio!)
  }

  /**
   * 计算偏移量
   * x 轴：（x轴点位 / 裁剪框体宽） * （最新的宽 - 老的宽）
   * y 轴：（y轴点位 / 裁剪框体高） * （最新的高 - 老的高）
   */
  const offsetX = (mouseX / cropBoxWidth) * (scaledWidth - currentDomWidth)
  const offsetY = (mouseY / cropBoxHeight) * (scaledHeight - currentDomHeight)

  return {
    width: scaledWidth,
    height: scaledHeight,
    offsetX,
    offsetY
  };
}

/** 计算旋转的中心坐标 */
export function calculateRotateCenter(step: IDrawCanvasInfo) {
  const {
    cropBoxWidth,
    cropBoxHeight,
    xDomOffset,
    yDomOffset
  } = step
  const x = cropBoxWidth / 2 + xDomOffset!
  const y = cropBoxHeight / 2 + yDomOffset!
  return {
    x,
    y
  }
}

/** 计算最大尺寸 */
function calcMaximumData (
  rawDomHeight: number,
  rawDomWidth: number,
  nowWidth: number,
  nowHeight: number,
  rawDomSize: IDomSize,
  rotateX: number,
  rotateY: number
) {
  const { width, height } = rawDomSize

  /** 判断是横屏还是竖屏 */
  const isHorizontal = nowWidth > nowHeight

  let newCropBoxWidth = nowWidth
  let newCropBoxHeight = nowHeight
  let zoom = 1
  let newRotateX = 0
  let newRotateY = 0

  // 防止除数为 0
  if (nowWidth <= 0 || nowHeight <= 0) {
    return {
      width: newCropBoxWidth,
      height: newCropBoxHeight,
      zoom,
      rotateX: newRotateX,
      rotateY: newRotateY,
      rawDomWidth: rawDomHeight,
      rawDomHeight: rawDomWidth
    }
  }

  /** 横屏 */
  if (isHorizontal) {
    /** 如果是横屏，就把裁切框体的宽设置为当前的最大宽度 */
    newCropBoxWidth = width
    const widthRatio = width / nowWidth
    newCropBoxHeight = nowHeight * widthRatio

    /** 判断当前的高是否超过最大值 */
    if (newCropBoxHeight > height) {
      newCropBoxHeight = height
      newCropBoxWidth = nowWidth * (height / nowHeight)
    }

    /** 统一使用最终尺寸计算缩放比例 */
    const widthZoom = newCropBoxWidth / nowWidth
    const heightZoom = newCropBoxHeight / nowHeight
    zoom = round(Math.min(widthZoom, heightZoom))
  } else {
    /** 竖屏 */
    newCropBoxHeight = height
    const heightRatio = height / nowHeight
    newCropBoxWidth = nowWidth * heightRatio

    /** 判断当前的宽是否超过最大值 */
    if (newCropBoxWidth > width) {
      newCropBoxWidth = width
      newCropBoxHeight = nowHeight * (width / nowWidth)
    }

    /** 统一使用最终尺寸计算缩放比例 */
    const widthZoom = newCropBoxWidth / nowWidth
    const heightZoom = newCropBoxHeight / nowHeight
    zoom = round(Math.min(widthZoom, heightZoom))
  }

  /** 计算最新的旋转中心 */
  if (rotateX) {
    newRotateY = rotateX * zoom
  }
  if (rotateY) {
    newRotateX = newCropBoxWidth - (rotateY * zoom)
  }

  return {
    width: newCropBoxWidth,
    height: newCropBoxHeight,
    zoom,
    rotateX: newRotateX,
    rotateY: newRotateY,
    rawDomWidth: rawDomHeight,
    rawDomHeight: rawDomWidth
  }
}

/** 计算翻转的时候数据 */
export function calcTurnData(
  step: IDrawCanvasInfo,
  rawDomSize: IDomSize,
  oldTurn: number,
  direction: 'left' | 'right'
) {
  console.log(step)
  const {
    rawDomHeight,
    rawDomWidth,
    rawImgHeight,
    rawImgWidth,
    currentDomWidth,
    currentDomHeight,
    cropBoxWidth,
    cropBoxHeight,
    fenceMaxHeight,
    fenceMaxWidth,
    fenceMinHeight,
    fenceMinWidth,
    xDomOffset,
    yDomOffset,
    rotateX,
    rotateY,
    zoom
  } = step

  /** 新的步骤 */
  const newStep = { ...step }
  
  /** cropBox 宽高计算 */
  const {
    width: newCropBoxWidth,
    height: newCropBoxHeight,
    zoom: newCropBoxZoom,
    rotateX: newRotateX,
    rotateY: newRotateY,
    rawDomWidth: newRawDomWidth,
    rawDomHeight: newRawDomHeight
  } = calcMaximumData(rawDomHeight, rawDomWidth, cropBoxHeight, cropBoxWidth, rawDomSize, rotateX ?? 0, rotateY ?? 0)

  newStep.cropBoxWidth = newCropBoxWidth
  newStep.cropBoxHeight = newCropBoxHeight
  newStep.zoom = round(newCropBoxZoom * zoom!)
  newStep.rotateX = newRotateX
  newStep.rotateY = newRotateY
  newStep.rawDomWidth = newRawDomWidth
  newStep.rawDomHeight = newRawDomHeight

  /** current 宽高计算 */
  const newCurrentDomWidth = currentDomHeight * newCropBoxZoom
  const newCurrentDomHeight = currentDomWidth * newCropBoxZoom
  newStep.currentDomWidth = newCurrentDomWidth
  newStep.currentDomHeight = newCurrentDomHeight

  /** 计算 fence 最大宽高 */
  const newFenceMaxWidth = fenceMaxHeight * newCropBoxZoom
  const newFenceMaxHeight = fenceMaxWidth * newCropBoxZoom
  newStep.fenceMaxWidth = newFenceMaxWidth
  newStep.fenceMaxHeight = newFenceMaxHeight

  /** 计算 fence 最小宽高 */
  const newFenceMinWidth = fenceMinHeight * newCropBoxZoom
  const newFenceMinHeight = fenceMinWidth * newCropBoxZoom
  newStep.fenceMinWidth = newFenceMinWidth
  newStep.fenceMinHeight = newFenceMinHeight

  /** 翻转 rawImg 宽高 */
  // newStep.rawImgWidth = rawImgHeight
  // newStep.rawImgHeight = rawImgWidth

  const newTurn = step.turn ?? 0
  
  if (newTurn !== oldTurn) {
    if (direction === 'right') {
      const newYDomOffset = xDomOffset! * newCropBoxZoom
      const newXDomOffset = newCurrentDomWidth - newCropBoxWidth - (yDomOffset! * newCropBoxZoom)
      newStep.xDomOffset = newXDomOffset
      newStep.yDomOffset = newYDomOffset
    }
    if (direction === 'left') {
      const newYDomOffset = yDomOffset! * newCropBoxZoom
      const newXDomOffset = newCurrentDomHeight - newCropBoxHeight - (xDomOffset! * newCropBoxZoom)
      newStep.xDomOffset = newYDomOffset
      newStep.yDomOffset = newXDomOffset
    }
  }
  
  return newStep
}

/**
 * 计算旋转后需要的尺寸，「最小外接矩形，WIKI：https://zh.wikipedia.org/zh-tw/最小外接矩形」
 */
export function calculateRotatedSize(
  angle: number,
  cropBoxWidth: number,
  cropBoxHeight: number,
  currentImgWidth: number,
  currentImgHeight: number,
  xDomOffset: number,
  yDomOffset: number
) {
  /**
   * 计算安全距离，即对角线长度
   */
  const diagonal = Math.sqrt(Math.pow(cropBoxWidth, 2) + Math.pow(cropBoxHeight, 2));
  /** X 轴安全距离 */
  const safeDistanceX = (diagonal - cropBoxWidth) / 2;
  /** Y 轴安全距离 */
  const safeDistanceY = (diagonal - cropBoxHeight) / 2;

  /** 检查是否在安全区域内 */
  const isInSafeArea = (width: number, height: number, x: number, y: number) => {
    /** 上边界检查 */
    if (y < safeDistanceY) return false;
    
    /** 左边界检查 */
    if (x < safeDistanceX) return false;
    
    /** 下边界检查 */
    if (height < (cropBoxHeight + y + safeDistanceY)) return false;
    
    /** 右边界检查 */
    if (width < (cropBoxWidth + x + safeDistanceX)) return false;
    
    return true;
  };
  
  /** 计算旋转所需的基础缩放比例 */
  const calculateRotationScale = (width: number, height: number, angle: number) => {
    const radian = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radian));
    const sin = Math.abs(Math.sin(radian));
    
    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = height * cos + width * sin;
    
    const scaleX = rotatedWidth / width;
    const scaleY = rotatedHeight / height;
    
    return Math.max(scaleX, scaleY);
  };

  /** 计算最终缩放比例 */
  const calculateFinalScale = () => {
    /** 如果在安全区域内，不需要缩放 */
    if (isInSafeArea(currentImgWidth, currentImgHeight, xDomOffset, yDomOffset)) {
      return 1;
    }
    
    /** 不在安全区域，使用标准旋转缩放 */
    return calculateRotationScale(cropBoxWidth, cropBoxHeight, angle);
  };


  return {
    scale: calculateFinalScale(),
  }
}

interface ImageSize {
  width: number;
  height: number;
}

interface Position {
  x: number;
  y: number;
}

interface CropCalculationResult {
  /** 需要应用的缩放比例 */
  scale: number;                 
  /** transform-origin 值 */
  transformOrigin: {
    x: number;
    y: number;
  };       
  /** 是否在安全区域内 */
  isInSafeArea: boolean;        
  /** 安全距离信息 */
  safeDistance: {               
    x: number;
    y: number;
  };
  /** 新的图片宽度 */
  newWidth: number;
  /** 新的图片高度 */
  newHeight: number;
  /** 裁切框对角线长度 */
  diagonal: number;             
  /** 旋转后的外切矩形宽高 */
  rotatedRectSize: {
    width: number;
    height: number;
  };
  /** 旋转后中心点与外切矩形左上角的偏移量 */
  offset?: {
    offsetX: number;
    offsetY: number;
  };
}

/**
 * 计算旋转后的外切矩形宽高
 * @param width 原始矩形宽度
 * @param height 原始矩形高度
 * @param angle 旋转角度（度数）
 * @returns 旋转后的外切矩形宽高
 */
function calculateRotatedRectSize(
  width: number,
  height: number,
  angle: number
): { width: number; height: number } {
  // 将角度转换为弧度
  const radian = (angle * Math.PI) / 180;
  
  // 使用绝对值避免负数
  const cos = Math.abs(Math.cos(radian));
  const sin = Math.abs(Math.sin(radian));
  
  // 计算旋转后的外切矩形宽高
  // 公式推导：
  // 旋转后的宽度 = 原宽度 * |cos θ| + 原高度 * |sin θ|
  // 旋转后的高度 = 原宽度 * |sin θ| + 原高度 * |cos θ|
  const rotatedWidth = width * cos + height * sin;
  const rotatedHeight = width * sin + height * cos;
  
  return {
    width: rotatedWidth,
    height: rotatedHeight
  };
}

/**
 * 计算两组偏移量：
 * 1. 图片相对于裁切框的偏移量(domOffset)
 * 2. 裁切框相对于外切矩形的偏移量(cropOffset)
 * @param width 原始矩形宽度
 * @param height 原始矩形高度
 * @param angle 旋转角度（-90 到 90 度）
 * @param rotationCenterX 旋转中心点X坐标（相对于原始矩形左上角）
 * @param rotationCenterY 旋转中心点Y坐标（相对于原始矩形左上角）
 * @returns 两组基于左上角的偏移量
 */
function calculateOffset(
  width: number,
  height: number,
  angle: number,
  rotationCenterX: number,
  rotationCenterY: number
): { 
  domOffset: { offsetX: number; offsetY: number };
  cropOffset: { offsetX: number; offsetY: number };
} {
  // 确保角度在 -90 到 90 度之间
  const clampedAngle = Math.max(-90, Math.min(90, angle));
  const radian = (clampedAngle * Math.PI) / 180;
  
  // 计算旋转后的外切矩形尺寸
  const { width: rotatedWidth, height: rotatedHeight } = calculateRotatedRectSize(width, height, clampedAngle);

  // 计算旋转变换
  const cos = Math.cos(radian);
  const sin = Math.sin(radian);

  // 计算原始左上角经过旋转后的新位置（相对于旋转中心点）
  const rotatedX = -rotationCenterX * cos + rotationCenterY * sin + rotationCenterX;
  const rotatedY = -rotationCenterX * sin - rotationCenterY * cos + rotationCenterY;

  // 计算图片相对于裁切框的偏移量（基于左上角）
  const domOffsetX = rotatedX - rotationCenterX;
  const domOffsetY = rotatedY - rotationCenterY;

  // 计算裁切框相对于外切矩形的偏移量（基于左上角）
  const cropOffsetX = (rotatedWidth - width) / 2;
  const cropOffsetY = (rotatedHeight - height) / 2;

  return {
    domOffset: {
      offsetX: domOffsetX,
      offsetY: domOffsetY
    },
    cropOffset: {
      offsetX: cropOffsetX,
      offsetY: cropOffsetY
    }
  };
}

/**
 * 计算图片裁切时的缩放和变换参数
 * @param imageSize 图片尺寸
 * @param cropBoxSize 裁切框尺寸
 * @param position 裁切框相对于图片的位置
 * @param angle 旋转角度（度数）
 * @returns 计算结果，包含缩放比例和变换原点
 */
export function calculateCropTransform(
  imageSize: ImageSize,
  cropBoxSize: ImageSize,
  position: Position,
  angle: number
): any {
  console.log(angle, position)
  
  /** 计算裁切框对角线长度 */
  const diagonal = Math.sqrt(
    Math.pow(cropBoxSize.width, 2) + Math.pow(cropBoxSize.height, 2)
  )

  /** X 轴安全距离 */
  const safeDistanceX = (diagonal - cropBoxSize.width) / 2;
  /** Y 轴安全距离 */
  const safeDistanceY = (diagonal - cropBoxSize.height) / 2;

  /** 检查是否在安全区域内 */
  const isInSafeArea = (
    width: number,
    height: number,
    x: number,
    y: number
  ): boolean => {
    // 上边界检查
    if (y < safeDistanceY) return false;
    
    // 左边界检查
    if (x < safeDistanceX) return false;
    
    // 下边界检查
    if (height < (cropBoxSize.height + y + safeDistanceY)) return false;
    
    // 右边界检查
    if (width < (cropBoxSize.width + x + safeDistanceX)) return false;
    
    return true;
  };

  /** 计算旋转所需的基础缩放比例 */
  const calculateRotationScale = (
    width: number,
    height: number,
    angle: number
  ): number => {
    const radian = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radian));
    const sin = Math.abs(Math.sin(radian));
    
    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = height * cos + width * sin;
    
    const scaleX = rotatedWidth / width;
    const scaleY = rotatedHeight / height;
    
    return Math.max(scaleX, scaleY);
  };

  /** 判断是否在安全区域内 */
  const inSafeArea = isInSafeArea(
    imageSize.width,
    imageSize.height,
    position.x,
    position.y
  );

  /** 计算最终缩放比例 */
  const scale = inSafeArea
    ? 1
    : calculateRotationScale(cropBoxSize.width, cropBoxSize.height, angle);

  /** 计算变换原点 */
  const transformOrigin = {
    x: cropBoxSize.width/2 + position.x,
    y: cropBoxSize.height/2 + position.y
  };

  /** 计算旋转后的外切矩形宽高 */
  const rotatedRectSize = calculateRotatedRectSize(
    cropBoxSize.width,
    cropBoxSize.height,
    angle
  );

  /** 计算外切矩形左上角相对于旋转中心点的偏移量 */
  const { domOffset, cropOffset } = calculateOffset(
    cropBoxSize.width,
    cropBoxSize.height,
    angle,
    transformOrigin.x,
    transformOrigin.y
  );

  const newWidth = imageSize.width * scale;
  const newHeight = imageSize.height * scale;

  return {
    scale,
    transformOrigin,
    isInSafeArea: inSafeArea,
    safeDistance: {
      x: safeDistanceX,
      y: safeDistanceY
    },
    newWidth,
    newHeight,
    diagonal,
    rotatedRectSize,
    domOffset,
    cropOffset
  };
}

/** 去除 base64 字符串的编码头，需要验证是否为 base64 字符串 */
export function removeBase64Header(base64: string) {
  if (!base64.startsWith('data:image/')) {
    return base64
  }
  return base64.split(',')[1];
}

/** 将 base64 字符串转换为 Blob，需要验证是否为 base64 字符串 */
export function base64ToBlob(base64: string) {
  if (!base64.startsWith('data:image/')) {
    throw new Error('Invalid base64 string');
  }
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while(n--){
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], {type: mime});
}

/** 给 base64 字符串添加编码头，根据 DEFAULT_RESULT_IMAGE_FORMAT 来决定是 png 还是 jpeg */
export function addBase64Header(base64: string) {
  return `data:image/${DEFAULT_RESULT_IMAGE_FORMAT === 2 ? 'png' : 'jpeg'};base64,${base64}`;
}

/**
 * 将 canvas 生成灰度的 base64 字符串
 * @param canvas 需要转换的 canvas
 * @param width 宽度
 * @param height 高度
 * @param hasHeader 返回的数据是否需要 base64 编码头
 * @returns 灰度的 base64 字符串
 */
export function canvasToGrayBase64(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  hasHeader: boolean = true
): string {
  // 创建临时 canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // 将原始 canvas 内容绘制到临时 canvas
  ctx.drawImage(canvas, 0, 0, width, height);
  
  // 获取像素数据
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 创建新的 ImageData 用于存储单通道灰度图
  const grayImageData = ctx.createImageData(width, height);
  const grayData = grayImageData.data;
  
  // 转换为二值灰度图
  for (let i = 0; i < data.length; i += 4) {
    // 检查像素是否存在（透明度不为0）
    const hasPixel = data[i + 3] > 0;
    
    // 设置灰度值：有像素为白色(255)，无像素为黑色(0)
    const grayValue = hasPixel ? 255 : 0;
    
    // 设置 RGB 通道为相同的灰度值
    grayData[i] = grayValue;     // R
    grayData[i + 1] = grayValue; // G
    grayData[i + 2] = grayValue; // B
    grayData[i + 3] = 255;       // A (完全不透明)
  }
  
  // 将灰度图绘制回临时 canvas
  ctx.putImageData(grayImageData, 0, 0);
  
  // 转换为 base64
  const base64 = tempCanvas.toDataURL('image/png');
  
  // 根据 hasHeader 参数决定是否返回完整的 base64 字符串
  return hasHeader ? base64 : base64.split(',')[1];
}

/**
 * 计算旋转后的外切矩形宽高
 * @param width 原始图片宽度
 * @param height 原始图片高度
 * @param angle 旋转角度
 * @returns 旋转后的外切矩形宽高
 */

export function calculateRotatedDimensions(
  width: number,
  height: number,
  angle: number
): { width: number; height: number } {
  const radian = (angle * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radian));
  const sin = Math.abs(Math.sin(radian));
  
  // 旋转后的宽度 = 原宽度 * |cos θ| + 原高度 * |sin θ|
  const rotatedWidth = width * cos + height * sin;
  // 旋转后的高度 = 原宽度 * |sin θ| + 原高度 * |cos θ|
  const rotatedHeight = width * sin + height * cos;
  
  return { width: rotatedWidth, height: rotatedHeight };
}

/**
 * 计算裁切框相对于外切矩形左上角的偏移量
 * @param originalOffset 原始裁切框偏移量
 * @param imageWidth 原始图片宽度
 * @param imageHeight 原始图片高度
 * @param angle 旋转角度
 * @returns 裁切框相对于外切矩形左上角的偏移量
 */
export function calculateCropBoxOffset(
  originalOffset: { x: number; y: number },
  imageWidth: number,
  imageHeight: number,
  angle: number
): { x: number; y: number } {
  const radian = (angle * Math.PI) / 180;
  
  // 计算旋转中心点（相对于图片左上角）
  const centerX = imageWidth / 2;
  const centerY = imageHeight / 2;
  
  // 计算裁切框中心点相对于旋转中心的偏移
  const relativeX = originalOffset.x - centerX;
  const relativeY = originalOffset.y - centerY;
  
  // 应用旋转变换矩阵
  const rotatedX = relativeX * Math.cos(radian) - relativeY * Math.sin(radian);
  const rotatedY = relativeX * Math.sin(radian) + relativeY * Math.cos(radian);
  
  // 计算相对于外切矩形左上角的最终偏移量
  const { width: boundingWidth, height: boundingHeight } = calculateRotatedDimensions(
    imageWidth,
    imageHeight,
    angle
  );
  
  return {
    x: rotatedX + boundingWidth / 2,
    y: rotatedY + boundingHeight / 2
  };
}

/** 延时函数 */
export function delay(ms: number = 100) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 计算新的裁切框宽高和图片尺寸
 * 确保图片等比例撑满裁切框，同时处理各种边界情况
 */
export function getNewWHXYData (
  nowWidth: number,  // 裁切框宽度
  nowHeigth: number, // 裁切框高度
  nowMaxWidth: number,
  nowMaxHeight: number,
  nowStep: IDrawCanvasInfo,
) {
  // 处理裁切框尺寸限制
  if (nowWidth > nowMaxWidth && nowHeigth > nowMaxHeight) {
    if (nowWidth > nowHeigth) {
      nowWidth = nowMaxWidth
      nowHeigth = nowWidth / (nowStep.cropRatio ?? 1)
    } else {
      nowHeigth = nowMaxHeight
      nowWidth = nowHeigth * (nowStep.cropRatio ?? 1)
    }
  }

  /** 如果新的高度大于最大高度，则将新的高度设置为最大高度，并重新计算宽度 */
  if (nowHeigth > nowMaxHeight) {
    nowHeigth = nowMaxHeight
    nowWidth = nowHeigth * (nowStep.cropRatio ?? 1)
  }

  /** 如果新的宽度大于最大宽度，则将新的宽度设置为最大宽度，并重新计算高度 */
  if (nowWidth > nowMaxWidth) {
    nowWidth = nowMaxWidth
    nowHeigth = nowWidth / (nowStep.cropRatio ?? 1)
  }
  
  /** 如果新的宽度小于最小宽度，则将新的宽度设置为最小宽度，并重新计算高度 */
  if (nowWidth < nowStep.fenceMinWidth) {
    nowWidth = nowStep.fenceMinWidth
    nowHeigth = nowWidth / (nowStep.cropRatio ?? 1)
  }

  /** 如果新的高度小于最小高度，则将新的高度设置为最小高度，并重新计算宽度 */
  if (nowHeigth < nowStep.fenceMinHeight) {
    nowHeigth = nowStep.fenceMinHeight
    nowWidth = nowHeigth * (nowStep.cropRatio ?? 1)
  }
  
  // 计算图片需要的尺寸，确保等比例填满裁切框
  const imageRatio = (nowStep.rawImgWidth ?? nowStep.currentDomWidth ?? 1) / 
                    (nowStep.rawImgHeight ?? nowStep.currentDomHeight ?? 1)
  
  let currentDomWidth, currentDomHeight
  
  if (imageRatio >= nowWidth / nowHeigth) {
    // 图片比例更宽,按高度适配
    currentDomHeight = nowHeigth
    currentDomWidth = Math.ceil(currentDomHeight * imageRatio)
  } else {
    // 图片比例更高,按宽度适配
    currentDomWidth = nowWidth
    currentDomHeight = Math.ceil(currentDomWidth / imageRatio)
  }

  // 计算缩放倍数
  // 使用当前宽度与原始宽度的比例
  const zoom = nowStep.rawDomWidth 
    ? round(currentDomWidth / nowStep.rawDomWidth, 4)
    : 1

  // 计算可移动的最大范围
  const maxOffsetX = currentDomWidth - nowWidth
  const maxOffsetY = currentDomHeight - nowHeigth
  
  // 默认居中显示
  let xDomOffset = Math.round(maxOffsetX / 2)
  let yDomOffset = Math.round(maxOffsetY / 2)
  
  // 确保偏移量在有效范围内
  xDomOffset = Math.max(0, Math.min(xDomOffset, maxOffsetX))
  yDomOffset = Math.max(0, Math.min(yDomOffset, maxOffsetY))

  // 更新步骤中的图片尺寸和缩放比例
  nowStep.currentDomWidth = currentDomWidth
  nowStep.currentDomHeight = currentDomHeight
  nowStep.zoom = zoom

  return {
    width: nowWidth,
    height: nowHeigth,
    xDomOffset,
    yDomOffset,
    currentDomWidth,
    currentDomHeight,
    zoom
  }
}

/** 根据高度获取等比例的宽度 */
export function getWidthForHeigth (nowStep: IDrawCanvasInfo, height: number, rawDomSize: IDomSize) {
  let nowHeigth = height
  let nowWidth = 0
  
  /** 允许的最大宽高 */
  const nowMaxWidth = Math.min(nowStep.currentDomWidth, rawDomSize?.width ?? 0, nowStep.fenceMaxWidth)
  const nowMaxHeight = Math.min(nowStep.currentDomHeight, rawDomSize?.height ?? 0, nowStep.fenceMaxHeight)

  /** 计算新的宽度 */
  nowWidth = nowHeigth * (nowStep.cropRatio ?? 1)

  return getNewWHXYData(nowWidth, nowHeigth, nowMaxWidth, nowMaxHeight, nowStep)
}

/** 根据宽度获取等比例的高度 */
export function getHeightForWidth (nowStep: IDrawCanvasInfo, width: number, rawDomSize: IDomSize) {
  let nowWidth = width
  let nowHeigth = 0

  /** 允许的最大宽高 */
  const nowMaxWidth = Math.min(nowStep.currentDomWidth, rawDomSize?.width ?? 0, nowStep.fenceMaxWidth)
  const nowMaxHeight = Math.min(nowStep.currentDomHeight, rawDomSize?.height ?? 0, nowStep.fenceMaxHeight)

  /** 计算新的高度 */
  nowHeigth = nowWidth / (nowStep.cropRatio ?? 1)

  return getNewWHXYData(nowWidth, nowHeigth, nowMaxWidth, nowMaxHeight, nowStep)
}

/** 图片裁切后裁切框及其附件放大 */
export function getCropBoxAndAttachmentWH (nowStep: IDrawCanvasInfo, rawDomSize: IDomSize) {
  /**
   * 1. 图片本身有一个裁切后的宽高：cropBoxWidth 和 cropBoxHeight
   * 2. 图片本身有一个裁切框相对于外切矩形左上角的偏移量：xCropOffset 和 yCropOffset
   * 3. 将图片裁切后的宽高与最大的父级外框 rawDomSize 进行对比，使其能适应最大的宽高，如 cropBoxWidth 和 cropBoxHeight 的宽高为 100 * 200，而 rawDomSize 的宽高是 1000*1000，那 cropBoxWidth 和 cropBoxHeight 就应该放大到 500*1000，既保持了原来的比例，也撑满了 1000*1000 的父级外框，需要注意的是，要考虑宽和高，两边都不能超过 rawDomSize 的宽高
   * 4. 裁切框放大后，计算裁切框放大的倍数，精确到小数点后 4 位，这里不管是计算宽和高应该都是一样的，因为裁切框的宽高是按照比例来计算的，所以计算出来的倍数是一样的
   * 5. 获取到放大的比例后，zoom 设置为该数值
   * 6. 将原来的 currentDomWidth 和 currentDomHeight 乘 zoom，获取到最新的 currentDomWidth 和 currentDomHeight
   * 7. 将原来的 xCropOffset 和 yCropOffset 乘 zoom，获取到最新的 xCropOffset 和 yCropOffset
   * 9. 围栏的最小宽高 fenceMinWidth 和 fenceMinHeight 直接乘 zoom
   * 10. 围栏的最大宽高 fenceMaxWidth 和 fenceMaxHeight 要根据乘以 zoom 后的 currentDomWidth 和 currentDomHeight 以及 rawDomSize 来计算，如果的 currentDomWidth 或者 currentDomHeight 大于 rawDomSize 的宽高，则取 rawDomSize 的宽高，如果的 currentDomWidth 或者 currentDomHeight 小于 rawDomSize 的宽高，则取 currentDomWidth 或者 currentDomHeight，这里尤其要注意，最大围栏的最大宽高不受比例限制，所以宽高要单独计算
   * 11. 返回 step 数据 2001*2572
   */
  
  const newStep = { ...nowStep };
  
  // 计算放大比例
  // 分别计算基于宽度和高度的放大比例
  const scaleByWidth = rawDomSize.width / nowStep.cropBoxWidth;
  const scaleByHeight = rawDomSize.height / nowStep.cropBoxHeight;
  
  /** 取较小的比例，确保两边都不超过父框 */
  const scale = Math.min(scaleByWidth, scaleByHeight);
  
  // 获取放大倍率
  const zoom = round(scale, 4);
  /**
   * 如果放大倍率为 1，使用原来的 zoom
   * 如果放大倍率不为 1，使用新的 zoom
   */
  newStep.zoom = round(zoom * (newStep.zoom ?? 1));
  
  // 更新宽高
  newStep.currentDomWidth = nowStep.currentDomWidth * zoom;
  newStep.currentDomHeight = nowStep.currentDomHeight * zoom;
  
  // 更新裁切框偏移量
  newStep.xDomOffset = (nowStep.xDomOffset ?? 0) * zoom;
  newStep.yDomOffset = (nowStep.yDomOffset ?? 0) * zoom;
  
  // 更新裁切框宽高
  newStep.cropBoxWidth = nowStep.cropBoxWidth * zoom;
  newStep.cropBoxHeight = nowStep.cropBoxHeight * zoom;
  
  // 更新围栏最小宽高
  newStep.fenceMinWidth = nowStep.fenceMinWidth * zoom;
  newStep.fenceMinHeight = nowStep.fenceMinHeight * zoom;
  
  // 更新围栏最大宽高（宽高单独计算，不受比例限制）
  // 如果缩放后的宽度大于rawDomSize的宽度，就取rawDomSize的宽度，否则取缩放后的宽度
  newStep.fenceMaxWidth = Math.min(newStep.currentDomWidth, rawDomSize.width);
  // 如果缩放后的高度大于rawDomSize的高度，就取rawDomSize的高度，否则取缩放后的高度
  newStep.fenceMaxHeight = Math.min(newStep.currentDomHeight, rawDomSize.height);
  
  return newStep;
}

/** 计算最小宽高 */
export function calculateMinWH (nowStep: IDrawCanvasInfo) {
  const {
    zoom = 1,
    cdProportions = 1
  } = { ...nowStep }

  /** 缩放比 * 最小允许宽高 * 当前缩放比例 */
  const minWidth = cdProportions * CANVAS_RENDER_MIN_WIDTH * zoom
  const minHeight = cdProportions * CANVAS_RENDER_MIN_HEIGHT * zoom

  return { minWidth, minHeight }
}

/**
 * 获取实时的宽高
 */
export function getWH(step: IDrawCanvasInfo) {

  const wMultiplied = step.currentDomWidth / step.cropBoxWidth
  const hMultiplied = step.currentDomHeight / step.cropBoxHeight
  return {
    currentWidth: Math.round(step.rawImgWidth / (wMultiplied ?? 1)),
    currentHeight: Math.round(step.rawImgHeight / (hMultiplied ?? 1))
  }
}

/**
 * 计算扩图模式的时候，点击比例时，计算扩图框体的宽高和 xy 轴偏移量
 */
export function calculateExpandBoxWHB (
  nowStep: IDrawCanvasInfo,
  rawDomSize: IDomSize,
  cropRatio: number | null
) {
  const {
    xDomOffset = 0,
    yDomOffset = 0,
    cropBoxWidth = 0,
    cropBoxHeight = 0,
    currentDomHeight = 0,
    currentDomWidth = 0,
    fenceMaxHeight = 0,
    fenceMaxWidth = 0
  } = { ...nowStep }
  const newStep = { ...nowStep }

  /** 当前图片的宽高比 */
  const currentRatio = round(currentDomWidth / currentDomHeight, 2)

  /** 当前比例扩图是否超过最大比例限制 */
  let isOverMaxRatio = false

  if (cropRatio === 0) {
    newStep.cropBoxWidth = currentDomWidth
    newStep.cropBoxHeight = currentDomHeight
    newStep.xDomOffset = 0
    newStep.yDomOffset = 0

    return {
      step: newStep,
      isOverMaxRatio
    }
  }

  if (cropRatio) {
    if (cropRatio >= 1) {
      console.log('当前图片的宽高比：', currentRatio, '期望的缩放比例：', cropRatio)
      /** 根据当前图片的高度来计算目标的宽度 */
      const targetWidth = cropRatio * currentDomHeight
      /** 如果目标宽度小于等于最大宽度，那说明目前没有问题 */
      if (targetWidth <= fenceMaxWidth) {
        if (targetWidth >= currentDomWidth) {
          /** 将裁切框的宽度设置为目标宽度 */
          newStep.cropBoxWidth = targetWidth
          /** 计算 x 轴的偏移量 */
          newStep.xDomOffset = -((targetWidth - currentDomWidth) / 2)
        } else {
          /** 这里说明目前目标宽度小于当前宽度，那就需要将目标宽度设置为当前图片宽度，然后根据当前图片的宽度结合比例去结算新的目标高度 */
          newStep.cropBoxWidth = currentDomWidth
          const newTargetHeight = currentDomWidth / cropRatio
          /** 如果新的目标高度小于最大高度，那说明没有问题 */
          if (newTargetHeight <= fenceMaxHeight) {
            newStep.cropBoxHeight = newTargetHeight
            newStep.yDomOffset = -((newTargetHeight - currentDomHeight) / 2)
          } else {
            /** 否则用 */
          }
        }
      } else {
        /** 如果目标宽度大于最大宽度，那就要将裁切框的宽度设置为最大宽度 */
        newStep.cropBoxWidth = fenceMaxWidth
        /** 根据目标宽度结合比例来计算目标高度 */
        const targetHeight = fenceMaxWidth / cropRatio
        console.log('targetHeight', targetHeight)
        /** 如果目标高度小于等于最大高度，那说明目前没有问题 */
        if (targetHeight <= fenceMaxHeight && targetHeight >= currentDomHeight) {
          /** 将裁切框的高度设置为目标高度 */
          newStep.cropBoxHeight = targetHeight
          /** 计算 y 轴的偏移量 */
          newStep.yDomOffset = -((targetHeight - currentDomHeight) / 2)
          /** 计算 x 轴的偏移量 */
          newStep.xDomOffset = -((targetWidth - currentDomWidth) / 2)
        } else {
          isOverMaxRatio = true
          /** 将裁切框的宽度设置为最大宽度 */
          newStep.cropBoxWidth = fenceMaxWidth
          /** 计算 x 轴的偏移量 */
          newStep.xDomOffset = -((fenceMaxWidth - currentDomWidth) / 2)

          /** 清除比例 */
          newStep.cropRatio = null
          newStep.cropRationLabel = 'none'
        }
      }
    } else if (cropRatio < 1) {
      /** 小于一说明期望的缩放比例是高大于宽 */
    }
  } else {
    /** 比例为 null 则代码 */
    newStep.cropBoxWidth = currentDomWidth
    newStep.cropBoxHeight = currentDomHeight
    newStep.xDomOffset = 0
    newStep.yDomOffset = 0
    /** 清除比例 */
    newStep.cropRatio = null
    newStep.cropRationLabel = 'none'
  }

  return {
    step: newStep,
    isOverMaxRatio
  }
}

export function calculateExpandBoxWH (
  nowStep: IDrawCanvasInfo,
  cropRatio: number | null
) {
  const {
    xDomOffset = 0,
    yDomOffset = 0,
    cropBoxWidth = 0,
    cropBoxHeight = 0,
    currentDomHeight = 0,
    currentDomWidth = 0,
    fenceMaxHeight = 0,
    fenceMaxWidth = 0
  } = { ...nowStep }
  const newStep = { ...nowStep }
  let isOverMaxRatio = false

  /** 目标维度 */
  let targetDimensions: number = 0

  switch (targetDimensions) {
    /** 原始比例 */
    case 0: {
      newStep.cropBoxWidth = currentDomWidth
      newStep.cropBoxHeight = currentDomHeight
      newStep.xDomOffset = 0
      newStep.yDomOffset = 0
      break
    }
    case 1: {

      break
    }
    case 2: {

      break
    }
    /** 恢复成默认状态 */
    default: {
      /** 比例为 null 则代码 */
      newStep.cropBoxWidth = currentDomWidth
      newStep.cropBoxHeight = currentDomHeight
      newStep.xDomOffset = 0
      newStep.yDomOffset = 0
      /** 清除比例 */
      newStep.cropRatio = null
      newStep.cropRationLabel = 'none'
      break
    }
  }

  return {
    step: newStep,
    isOverMaxRatio
  }
}

/**
 * 通用扩图算法，确保裁切框完全包含原图
 * @param nowStep 当前步骤信息
 * @param targetRatio 目标比例（宽/高），null表示使用原图比例
 * @returns 更新后的步骤信息和是否超出最大比例限制
 */
export function calculateExpandBoxUniversal(
  nowStep: IDrawCanvasInfo,
  targetRatio: number | null
): { step: IDrawCanvasInfo, isOverMaxRatio: boolean } {
  // 创建新的步骤对象，避免修改原对象
  const newStep = { ...nowStep };
  
  // 获取当前图片信息
  const {
    currentDomWidth = 0,
    currentDomHeight = 0,
    fenceMaxWidth = 0,
    fenceMaxHeight = 0
  } = nowStep;
  
  // 如果目标比例为null或0，使用原图比例
  if (targetRatio === null || targetRatio === 0) {
    /** 恢复成默认状态，这里有一个点如果恢复成默认状态，用户体验上会有点跳跃 */
    newStep.cropBoxWidth = currentDomWidth;
    newStep.cropBoxHeight = currentDomHeight;
    newStep.xDomOffset = 0;
    newStep.yDomOffset = 0;
    newStep.cropRatio = null;
    newStep.cropRationLabel = 'none';
    return { step: newStep, isOverMaxRatio: false };
  }
  
  // 计算当前图片的宽高比
  const currentRatio = currentDomWidth / currentDomHeight;
  
  // 初始化变量
  let cropBoxWidth = 0;
  let cropBoxHeight = 0;
  let xDomOffset = 0;
  let yDomOffset = 0;
  let isOverMaxRatio = false;
  
  // 计算最大可扩展区域
  const maxExpandWidth = fenceMaxWidth;
  const maxExpandHeight = fenceMaxHeight;
  
  // 关键算法：计算能够完全包含原图且满足目标比例的最小裁切框
  
  // 方法1：基于宽度计算高度
  const heightBasedOnWidth = currentDomWidth / targetRatio;
  const method1Valid = heightBasedOnWidth >= currentDomHeight && heightBasedOnWidth <= maxExpandHeight;
  
  // 方法2：基于高度计算宽度
  const widthBasedOnHeight = currentDomHeight * targetRatio;
  const method2Valid = widthBasedOnHeight >= currentDomWidth && widthBasedOnHeight <= maxExpandWidth;
  
  if (method1Valid && method2Valid) {
    // 两种方法都可行，选择裁切框面积较小的方案
    if (currentDomWidth * heightBasedOnWidth <= widthBasedOnHeight * currentDomHeight) {
      // 方法1面积更小
      cropBoxWidth = currentDomWidth;
      cropBoxHeight = heightBasedOnWidth;
      xDomOffset = 0;
      yDomOffset = -(heightBasedOnWidth - currentDomHeight) / 2;
    } else {
      // 方法2面积更小
      cropBoxWidth = widthBasedOnHeight;
      cropBoxHeight = currentDomHeight;
      xDomOffset = -(widthBasedOnHeight - currentDomWidth) / 2;
      yDomOffset = 0;
    }
  } else if (method1Valid) {
    // 只有方法1可行
    cropBoxWidth = currentDomWidth;
    cropBoxHeight = heightBasedOnWidth;
    xDomOffset = 0;
    yDomOffset = -(heightBasedOnWidth - currentDomHeight) / 2;
  } else if (method2Valid) {
    // 只有方法2可行
    cropBoxWidth = widthBasedOnHeight;
    cropBoxHeight = currentDomHeight;
    xDomOffset = -(widthBasedOnHeight - currentDomWidth) / 2;
    yDomOffset = 0;
  } else {
    // 两种方法都不可行，尝试在最大限制内找到最接近目标比例的方案
    
    // 方案1：使用最大宽度
    const heightForMaxWidth = maxExpandWidth / targetRatio;
    const plan1Valid = heightForMaxWidth >= currentDomHeight && heightForMaxWidth <= maxExpandHeight;
    
    // 方案2：使用最大高度
    const widthForMaxHeight = maxExpandHeight * targetRatio;
    const plan2Valid = widthForMaxHeight >= currentDomWidth && widthForMaxHeight <= maxExpandWidth;
    
    if (plan1Valid) {
      // 使用最大宽度方案
      cropBoxWidth = maxExpandWidth;
      cropBoxHeight = heightForMaxWidth;
      xDomOffset = -(maxExpandWidth - currentDomWidth) / 2;
      yDomOffset = -(heightForMaxWidth - currentDomHeight) / 2;
    } else if (plan2Valid) {
      // 使用最大高度方案
      cropBoxWidth = widthForMaxHeight;
      cropBoxHeight = maxExpandHeight;
      xDomOffset = -(widthForMaxHeight - currentDomWidth) / 2;
      yDomOffset = -(maxExpandHeight - currentDomHeight) / 2;
    } else {
      // 无法满足目标比例，返回原图
      isOverMaxRatio = true;
      cropBoxWidth = currentDomWidth;
      cropBoxHeight = currentDomHeight;
      xDomOffset = 0;
      yDomOffset = 0;
    }
  }
  
  // 最终安全检查：确保裁切框不小于原图尺寸
  if (cropBoxWidth < currentDomWidth || cropBoxHeight < currentDomHeight) {
    isOverMaxRatio = true;
    cropBoxWidth = currentDomWidth;
    cropBoxHeight = currentDomHeight;
    xDomOffset = 0;
    yDomOffset = 0;
  }
  
  // 更新步骤信息
  newStep.cropBoxWidth = round(cropBoxWidth);
  newStep.cropBoxHeight = round(cropBoxHeight);
  newStep.xDomOffset = round(xDomOffset);
  newStep.yDomOffset = round(yDomOffset);
  newStep.cropRatio = isOverMaxRatio ? null : targetRatio;
  // newStep.cropRationLabel = (isOverMaxRatio ? 'none' : String(targetRatio)) as ICropRatio;
  
  return { step: newStep, isOverMaxRatio };
}