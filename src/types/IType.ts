
/** DOM 的宽高 */
export interface IDomSize {
  width: number;
  height: number;
}

export interface IErasePoint {
  x: number;
  y: number;
  size: number;
  color: string;
}

export type IErasePoints = Array<Array<IErasePoint>>;

/**
 * 压缩结果接口
 */
export interface ICompressResult {
  /** 压缩后的 base64 数据 */
  base64: string;
  /** 压缩后的宽度 */
  width: number;
  /** 压缩后的高度 */
  height: number;
}

/** 拖拽的把手 */
export type IDraggableGripper = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br' | 'body' | 'zoom';

/** 裁剪比例，默认有无限制和原比例 */
export type ICropRatio = 'none' | 'original' | '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '1:2' | '2:1' | '2:3' | '3:2' | '4:5' | '5:4';

/**
 * 图片模式
 * crop: 裁剪
 * background: 去除背景
 * compress: 压缩图片
 * erase: 橡皮擦工具
 * expand: 图片扩展
 * resolution: 提升解析度
 */
export type IImageMode = 'crop' | 'remove-bg' | 'compress' | 'erase' | 'expand' | 'hd';

/** 图片信息 */
export interface IImageInfo {
  image?: HTMLImageElement;
  canvasWidth: number;
  canvasHeight: number;
  styleWidth: number;
  styleHeight: number;
}

/** 渲染步骤 */
export interface IRenderStep {
  /** x 轴 */
  x?: number;
  /** y 轴 */
  y?: number;
  /** canvas 宽度 */
  canvasWidth?: number;
  /** canvas 高度 */
  canvasHeight?: number;
  /** 样式宽度 */
  styleWidth?: number;
  /** 样式高度 */
  styleHeight?: number;
  /** 旋转角度 */
  rotate?: number;
  /** 旋转 x 轴 */
  rotateX?: number;
  /** 旋转 y 轴 */
  rotateY?: number;
  /** 缩放 */
  scale?: number;
  /** 缩放 x 轴 */
  scaleX?: number;
  /** 缩放 y 轴 */
  scaleY?: number;
}

/** canvas 信息 */
export interface IDrawCanvasInfo {
  /** 图片 id */
  imgId: string;
  /** 图片模式 */
  mode: IImageMode;
  /** X 轴单次移动距离 */
  moveX: number;
  /** Y 轴单次移动距离 */
  moveY: number;
  /** 操作的把手 */
  gripper: IDraggableGripper;
  /** 围栏最大宽 */
  fenceMaxWidth: number;
  /** 围栏最大高 */
  fenceMaxHeight: number;
  /** 围栏最小宽 */
  fenceMinWidth: number;
  /** 围栏最小高 */
  fenceMinHeight: number;
  /** 渲染窗口的实时宽 */
  currentDomWidth: number;
  /** 渲染窗口的实时高 */
  currentDomHeight: number;
  /** 裁切框体的宽度，实时修改 */
  cropBoxWidth: number;
  /** 裁切框体的高度，实时修改 */
  cropBoxHeight: number;
  /** 裁切框相对于外切矩形左上角的 X 轴偏移量 */
  xCropOffset: number;
  /** 裁切框相对于外切矩形左上角的 Y 轴偏移量 */
  yCropOffset: number;
  /** 基于 dom 原点（0, 0）的 X 轴偏移量 */
  xDomOffset?: number;
  /** 基于 dom 原点（0, 0）的 Y 轴偏移量 */
  yDomOffset?: number;
  /** 渲染窗口的原始宽 */
  rawDomWidth: number;
  /** 渲染窗口的原始高 */
  rawDomHeight: number;
  /** ⚠️⚠️⚠️⚠️目标图片显示宽度，弃用，使用 currentDomWidth 代替 */
  domWidth?: number;
  /** ⚠️⚠️⚠️⚠️目标图片显示高度，弃用，使用 currentDomHeight 代替 */
  domHeight?: number;
  /** 源文件图片宽度 */
  rawImgWidth: number;
  /** 源文件图片高度 */
  rawImgHeight: number;
  /** 缩放比例 */
  zoom?: number;
  /** 原始宽高比 */
  rawAspectRatio?: number;
  /** 当前的控制方式 */
  controlMode?: 'drag' | 'zoom';
  /** 源文件图片绘制 x 轴起点 */
  sx: number;
  /** 源文件图片绘制 y 轴起点 */
  sy: number;
  /** 源文件图片目标绘制宽度 */
  sWidth: number;
  /** 源文件图片目标绘制高度 */
  sHeight: number;
  /** 目标 canvas 绘制 x 轴起点 */
  dx: number;
  /** 目标 canvas 绘制 y 轴起点 */
  dy: number;
  /** 目标 canvas 绘制宽度 */
  dWidth: number;
  /** 目标 canvas 绘制高度 */
  dHeight: number;
  /** 目标 canvas 最小宽度 */
  domMinWidth?: number;
  /** 目标 canvas 最小高度 */
  domMinHeight?: number;
  /** 转向次数，一次为 90 度，四次恢复原样 */
  turn?: number;
  /** 旋转角度 */
  rotate?: number;
  /** 旋转 x 轴 */
  rotateX?: number;
  /** 旋转 y 轴 */
  rotateY?: number;
  /** 缩放 */
  scale?: number;
  /** 缩放 x 轴 */
  scaleX?: number;
  /** 是否禁用表单 */
  disabledForm?: boolean;
  /** 缩放 y 轴 */
  scaleY?: number;
  /** 原图与 canvas 的缩放比例 */
  proportion?: number | null;
  /** 背景颜色 */
  bgColor?: string;
  /** 擦除路径 */
  erasePoints?: IErasePoints;
  /** 橡皮擦大小 */
  eraserSize?: number;
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
  /** 翻转 */
  flip?: 'x' | 'y';
  /** x 轴翻转状态 */
  flipX?: 1 | -1;
  /** y 轴翻转状态 */
  flipY?: 1 | -1;
  /** 当前 canvas 与 DOM 的缩放比例 */
  cdProportions?: number;
  /** 裁剪比例 */
  cropRatio?: number | null;
  /** 裁剪比例标签 */
  cropRationLabel?: string;
  /** 当前步骤最大宽度 */
  nowStepMaxWidth?: number;
  /** 当前步骤最大高度 */
  nowStepMaxHeight?: number;
  /** 当前步骤最小宽度 */
  nowStepMinWidth?: number;
  /** 当前步骤最小高度 */
  nowStepMinHeight?: number;
}

/** PhotoStudio 接口定义 */
export interface IPhotoStudio {
  resetAll: () => void;
  setWidthAndHeight: (width: number, height: number, direction?: 'width' | 'height') => void;
  exportImage: () => void;
  rotate: (angle: number) => void;
  rollback: () => void;
  forward: () => void;
  reset: () => void;
  flip: (direction: 'x' | 'y') => void;
  cropRatio: (ratio: { ratio: number | null, label: string }) => void;
  turn: (direction: 'left' | 'right') => void;
  expandImageBtn: () => void;
  eraseImage: () => void;
  setEraserSize: (size: number) => void;
  removeBg: () => void;
  setRemoveBgColor: (color: string) => void;
  hd: () => void;
  switchMode: (oldMode: IImageMode, newMode: IImageMode) => void;
}
