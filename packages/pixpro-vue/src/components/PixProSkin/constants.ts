// 定义本地类型，不从外部导入
/** 拖动抓手名称 */
export type IDraggableGripper = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br' | 'body' | 'zoom';

/** 裁剪比例类型 */
export type ICropRatio = 'none' | 'original' | '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | '1:2' | '2:1' | '2:3' | '3:2' | '4:5' | '5:4';

/** 橡皮擦默认大小 */
export const DEFAULT_ERASER_SIZE = 50;

/** 上传图片的压缩阈值 */
export const MAX_UPLOAD_IMAGE_SIZE = 1
export const MAX_UPLOAD_IMAGE_WIDTH = 3000;

/** 擦除最小宽高 */
export const MIN_ERASE_IMAGE_WIDTH = 500;
export const MIN_ERASE_IMAGE_HEIGHT = 500;
/** 擦除最大宽高 */
export const MAX_ERASE_IMAGE_WIDTH = 5000;
export const MAX_ERASE_IMAGE_HEIGHT = 5000;

/** 移除背景的最低宽高 */
export const MIN_REMOVE_BG_WIDTH = 256;
export const MIN_REMOVE_BG_HEIGHT = 256;
/** 移除背景的最大宽高 */
export const MAX_REMOVE_BG_WIDTH = 5000;
export const MAX_REMOVE_BG_HEIGHT = 5000;

/** 解析度提升最小分辨率 */
export const MIN_HD_IMAGE_WIDTH = 256;
export const MIN_HD_IMAGE_HEIGHT = 256;
/** 解析度提升最大分辨率 */
export const MAX_HD_IMAGE_WIDTH = 5000;
export const MAX_HD_IMAGE_HEIGHT = 5000;

/** 扩图最小支持的分辨率 */
export const MIN_EXPAND_IMAGE_WIDTH = 256;
export const MIN_EXPAND_IMAGE_HEIGHT = 256;
/** 扩图的最大宽高 */
export const MAX_EXPAND_IMAGE_HEIGHT = 5000;
export const MAX_EXPAND_IMAGE_WIDTH = 5000;

/** 后台默认生成链接还是 base64，0 是 base64，1 是链接 */
export const DEFAULT_RESULT_FORMAT: 0 | 1 = 0;

/** 后台默认生成图片的格式，2 是 png，1 是 jpeg */
export const DEFAULT_RESULT_IMAGE_FORMAT: 2 | 1 = 2;

/** 静默状态下图片的压缩质量 */
export const SILENT_IMAGE_QUALITY = 0.7;

/** 扩图的时候缩小的倍数 */
export const EXPAND_IMAGE_SCALE = 0.5
/** 开发模式 */
export const IS_DEV = false;

/** canvas 渲染的最大宽度 */
export const CANVAS_RENDER_MAX_WIDTH = 3000;
/** canvas 渲染的最大高度 */
export const CANVAS_RENDER_MAX_HEIGHT = 3000;

/** canvas 渲染的最小宽度，这里是指画布的宽度 */
export const CANVAS_RENDER_MIN_WIDTH = 100;
/** canvas 渲染的最小高度，这里是指画布的高度 */
export const CANVAS_RENDER_MIN_HEIGHT = 100;

/** 支持上传的文件类型 */
export const ACCEPT_UPLOAD_TYPE = '.png,.jpg,.jpeg';

/** 节流时间 */
export const THROTTLE_TIME = 500;

/** 缩放颗粒度 */
export const SCALE_GRANULARITY = 0.08;

/** 拖动的抓手合集 */
export const DRAG_GRIPPER_NAME: IDraggableGripper[] = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br', 'zoom'];

/** 拖动的抓手样式 */
export const DRAG_GRIPPER_STYLE: Record<IDraggableGripper, string[]> = {
  tl: ['bottom', 'right'],
  t: ['bottom', 'left'],
  tr: ['bottom', 'left'],
  l: ['top', 'right'],
  r: ['top', 'left'],
  bl: ['top', 'right'],
  b: ['top', 'left'],
  br: ['top', 'left'],
  body: ['top', 'left'],
  zoom: ['top', 'left']
};

/** 裁剪比例 */
export const CROP_RATIO: Record<ICropRatio, number | null> = {
  none: null,
  original: 0,
  '1:1': 1,
  '3:4': 3 / 4,
  '4:3': 4 / 3,
  '9:16': 9 / 16,
  '16:9': 16 / 9,
  '1:2': 1 / 2,
  '2:1': 2 / 1,
  '2:3': 2 / 3,
  '3:2': 3 / 2,
  '4:5': 4 / 5,
  '5:4': 5 / 4,
};
