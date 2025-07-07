/** 橡皮擦默认大小 */
const DEFAULT_ERASER_SIZE = 50;

/** 上传图片的压缩阈值 */
const MAX_UPLOAD_IMAGE_SIZE = 1;
const MAX_UPLOAD_IMAGE_WIDTH = 3000;

/** 擦除最小宽高 */
const MIN_ERASE_IMAGE_WIDTH = 500;
const MIN_ERASE_IMAGE_HEIGHT = 500;
/** 擦除最大宽高 */
const MAX_ERASE_IMAGE_WIDTH = 5000;
const MAX_ERASE_IMAGE_HEIGHT = 5000;

/** 移除背景的最低宽高 */
const MIN_REMOVE_BG_WIDTH = 256;
const MIN_REMOVE_BG_HEIGHT = 256;
/** 移除背景的最大宽高 */
const MAX_REMOVE_BG_WIDTH = 5000;
const MAX_REMOVE_BG_HEIGHT = 5000;

/** 解析度提升最小分辨率 */
const MIN_HD_IMAGE_WIDTH = 256;
const MIN_HD_IMAGE_HEIGHT = 256;
/** 解析度提升最大分辨率 */
const MAX_HD_IMAGE_WIDTH = 3000;
const MAX_HD_IMAGE_HEIGHT = 3000;

/** 扩图最小支持的分辨率 */
const MIN_EXPAND_IMAGE_WIDTH = 256;
const MIN_EXPAND_IMAGE_HEIGHT = 256;
/** 扩图的最大宽高 */
const MAX_EXPAND_IMAGE_HEIGHT = 5000;
const MAX_EXPAND_IMAGE_WIDTH = 5000;

/** 后台默认生成链接还是 base64，0 是 base64，1 是链接 */
const DEFAULT_RESULT_FORMAT = 0;

/** 后台默认生成图片的格式，2 是 png，1 是 jpeg */
const DEFAULT_RESULT_IMAGE_FORMAT = 2;

/** 静默状态下图片的压缩质量 */
const SILENT_IMAGE_QUALITY = 0.7;

/** 扩图的时候缩小的倍数 */
const EXPAND_IMAGE_SCALE = 0.5;
/** 开发模式 */
const IS_DEV = false;

/** canvas 渲染的最大宽度 */
const CANVAS_RENDER_MAX_WIDTH = 3000;
/** canvas 渲染的最大高度 */
const CANVAS_RENDER_MAX_HEIGHT = 3000;

/** canvas 渲染的最小宽度，这里是指画布的宽度 */
const CANVAS_RENDER_MIN_WIDTH = 100;
/** canvas 渲染的最小高度，这里是指画布的高度 */
const CANVAS_RENDER_MIN_HEIGHT = 100;

/** 支持上传的文件类型 */
const ACCEPT_UPLOAD_TYPE = ".png,.jpg,.jpeg";

/** 节流时间 */
const THROTTLE_TIME = 500;

/** 缩放颗粒度 */
const SCALE_GRANULARITY = 0.08;

/** 拖动的抓手合集 */
const DRAG_GRIPPER_NAME = ["tl", "t", "tr", "l", "r", "bl", "b", "br", "zoom"];

/** 拖动的抓手样式 */
const DRAG_GRIPPER_STYLE = {
  tl: ["bottom", "right"],
  t: ["bottom", "left"],
  tr: ["bottom", "left"],
  l: ["top", "right"],
  r: ["top", "left"],
  bl: ["top", "right"],
  b: ["top", "left"],
  br: ["top", "left"],
  body: ["top", "left"],
  zoom: ["top", "left"],
};

/** 裁剪比例 */
const CROP_RATIO = {
  none: null,
  original: 0,
  "1:1": 1,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  "1:2": 1 / 2,
  "2:1": 2 / 1,
  "2:3": 2 / 3,
  "3:2": 3 / 2,
  "4:5": 4 / 5,
  "5:4": 5 / 4,
};
export default {
  DEFAULT_ERASER_SIZE,
  MAX_UPLOAD_IMAGE_SIZE,
  MAX_UPLOAD_IMAGE_WIDTH,
  MIN_REMOVE_BG_WIDTH,
  MIN_REMOVE_BG_HEIGHT,
  MAX_REMOVE_BG_WIDTH,
  MAX_REMOVE_BG_HEIGHT,
  MAX_HD_IMAGE_WIDTH,
  MAX_HD_IMAGE_HEIGHT,
  MIN_HD_IMAGE_WIDTH,
  MIN_HD_IMAGE_HEIGHT,
  MIN_EXPAND_IMAGE_WIDTH,
  MIN_EXPAND_IMAGE_HEIGHT,
  MAX_EXPAND_IMAGE_WIDTH,
  MAX_EXPAND_IMAGE_HEIGHT,
  MIN_ERASE_IMAGE_WIDTH,
  MIN_ERASE_IMAGE_HEIGHT,
  MAX_ERASE_IMAGE_WIDTH,
  MAX_ERASE_IMAGE_HEIGHT,
  DEFAULT_RESULT_FORMAT,
  DEFAULT_RESULT_IMAGE_FORMAT,
  SILENT_IMAGE_QUALITY,
  EXPAND_IMAGE_SCALE,
  IS_DEV,
  CANVAS_RENDER_MAX_WIDTH,
  CANVAS_RENDER_MAX_HEIGHT,
  CANVAS_RENDER_MIN_WIDTH,
  CANVAS_RENDER_MIN_HEIGHT,
  ACCEPT_UPLOAD_TYPE,
  THROTTLE_TIME,
  SCALE_GRANULARITY,
  DRAG_GRIPPER_NAME,
  DRAG_GRIPPER_STYLE,
  CROP_RATIO,
};
