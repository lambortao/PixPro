import { ReactNode } from "react";
import { ICropRatio, IDrawCanvasInfo } from "../../../../src/index";

export type TabType = "crop" | "erase" | "remove-bg" | "hd" | "compress" | "expand";

export type ControlTextType = {
  [K in TabType]: {
    btn: string;
    title: string;
    desc: string;
    icon: string;
  };
};

export interface PixProSkinProps {
  width: number;
  height: number;
  loading: boolean;
  stepIndex: number;
  stepList: IDrawCanvasInfo[];
  aiLoading: boolean;
  isOperate: boolean;
  children: ReactNode;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onRollback: () => void;
  onForward: () => void;
  onReset: () => void;
  onFlip: (direction: "x" | "y") => void;
  onCropRatio: (ratio: ICropRatio) => void;
  onTurn: (direction: "left" | "right") => void;
  onRotate: (angle: number) => void;
  onExportImage: () => void;
  onExpandImageBtn: () => void;
  onEraseImage: () => void;
  onSetEraserSize: (size: number) => void;
  onRemoveBg: () => void;
  onSwitchMode: (params: { oldMode: string; newMode: string }) => void;
  onHd: () => void;
  onHandleSizeChange: (direction: "width" | "height") => void;
}

// 添加检查分辨率的常量
export const MIN_REMOVE_BG_WIDTH = 50;
export const MIN_REMOVE_BG_HEIGHT = 50;
export const MAX_HD_IMAGE_WIDTH = 3200;
export const MAX_HD_IMAGE_HEIGHT = 3200;
export const MIN_HD_IMAGE_WIDTH = 50;
export const MIN_HD_IMAGE_HEIGHT = 50;
export const MIN_EXPAND_IMAGE_WIDTH = 256;
export const MIN_EXPAND_IMAGE_HEIGHT = 256;
export const MAX_EXPAND_IMAGE_WIDTH = 2048;
export const MAX_EXPAND_IMAGE_HEIGHT = 2048;
export const MIN_ERASE_IMAGE_WIDTH = 256;
export const MIN_ERASE_IMAGE_HEIGHT = 256;
export const MAX_ERASE_IMAGE_WIDTH = 2048;
export const MAX_ERASE_IMAGE_HEIGHT = 2048;

// 颜色列表类型
export const colorList = [
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
];

// 裁剪比例类型
export const cropRatios = {
  original: 0,
  '1:1': 1,
  '4:3': 4 / 3,
  '16:9': 16 / 9,
  '9:16': 9 / 16
}; 