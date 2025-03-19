/** 拖动抓手名称 */
export type IDraggableGripper = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br' | 'body' | 'zoom';

/** 裁剪比例 */
export type ICropRatio = 'none' | 'original' | '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '1:2' | '2:1' | '2:3' | '3:2' | '4:5' | '5:4';

/** 图片处理模式 */
export type IImageMode = 'crop' | 'erase' | 'remove-bg' | 'hd' | 'compress' | 'expand';

/** 画布信息 */
export interface IDrawCanvasInfo {
  /** 图片 URL */
  url: string;
  /** 原始图片宽度 */
  originalWidth: number;
  /** 原始图片高度 */
  originalHeight: number;
  /** 裁剪框宽度 */
  cropBoxWidth: number;
  /** 裁剪框高度 */
  cropBoxHeight: number;
  /** 围栏最小宽度 */
  fenceMinWidth: number;
  /** 围栏最小高度 */
  fenceMinHeight: number;
  /** 模式 */
  mode: IImageMode;
  /** X轴偏移量 */
  xDomOffset: number;
  /** Y轴偏移量 */
  yDomOffset: number;
  /** 旋转角度 */
  rotate: number;
  /** 裁剪比例 */
  cropRatio: number | null;
  /** 裁剪比例标签 */
  cropRationLabel: string;
  /** 水平翻转 */
  flipX: boolean;
  /** 垂直翻转 */
  flipY: boolean;
  /** 水平镜像 */
  mirrorX: boolean;
  /** 垂直镜像 */
  mirrorY: boolean;
  /** 擦除点集合 */
  erasePoints?: {x: number, y: number, size: number}[];
  /** 背景颜色 */
  bgColor?: string;
  [key: string]: any;
} 