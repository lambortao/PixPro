export const controlTextData = {
  crop: {
    btn: '裁切',
    title: '裁切',
    desc: '',
    icon: 'crop-btn'
  },
  expand: {
    btn: '扩图',
    title: '扩图',
    desc: '向外扩展图片，AI将填充图片以外的部分。',
    icon: 'expand-btn'
  },
  erase: {
    btn: '擦除',
    title: '擦除',
    desc: '涂抹想要从图片中擦除的区域',
    icon: 'erase-btn'
  },
  'remove-bg': {
    btn: '移除背景',
    title: '移除背景',
    desc: '一键抠出图片中的主体。',
    icon: 'remove-bg-btn'
  },
  hd: {
    btn: '提升解析度',
    title: '提升解析度',
    desc: '最大可提升至 3200 x 3200',
    icon: 'hd-btn'
  }
}

export const cropControlData = {
  original: 0,
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '9:16': 9 / 16
}

/** 颜色列表 */
export const colorListData = [
  'transparent',
  '#ffffff',
  '#e3e9ef',
  '#dbe9fd',
  '#afc5c1',
  '#a2e1c9',
  '#4067c5',
  '#0b209f',
  '#4041c3',
  '#27297e',
  '#5a335f',
  '#d74f3c',
  '#ebaacb',
  '#fbe8e3',
  '#f3e48b',
  '#ccef7a',
  '#75c097',
  '#62b6b0',
  '#6de9b0',
  '#83c8df'
]

/** 拖拽的把手 */
export type IDraggableGripper = 'tl' | 't' | 'tr' | 'l' | 'r' | 'bl' | 'b' | 'br' | 'body' | 'zoom';

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
