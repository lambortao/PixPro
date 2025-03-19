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