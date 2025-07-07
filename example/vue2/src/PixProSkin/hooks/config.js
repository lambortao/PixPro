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
    desc: '向外扩展图片，AI将填充图片以外的部分',
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
    desc: '一键抠出图片中的主体',
    icon: 'remove-bg-btn'
  },
  hd: {
    btn: '提升解析度',
    title: '提升解析度',
    desc: '立即提提升图片解析度',
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
  '#2b4b8c',
  '#1a2b4c',
  '#000000'
]


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
export const MAX_HD_IMAGE_WIDTH = 3000;
export const MAX_HD_IMAGE_HEIGHT = 3000;

/** 扩图最小支持的分辨率 */
export const MIN_EXPAND_IMAGE_WIDTH = 256;
export const MIN_EXPAND_IMAGE_HEIGHT = 256;
/** 扩图的最大宽高 */
export const MAX_EXPAND_IMAGE_HEIGHT = 5000;
export const MAX_EXPAND_IMAGE_WIDTH = 5000;
