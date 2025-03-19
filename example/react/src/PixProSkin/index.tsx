import React, { useState, useRef, useEffect } from "react";
import { ICropRatio, IDrawCanvasInfo } from "../../../../src/index";
import SvgIcon from "./SvgIcon";
// 旋转尺子
import AngleAdjustment from "./AngleAdjustment";
// 特殊操作按钮
import ColoredBtn from "./ColoredBtn";
// 滑动器
import EraserSizeSlider from "./EraserSizeSlider";
import "./index.less";

type TabType = "crop" | "erase" | "remove-bg" | "hd" | "compress" | "expand";

type ControlTextType = {
  [K in TabType]: {
    btn: string;
    title: string;
    desc: string;
    icon: string;
  };
};

interface PixProSkinProps {
  width: number;
  height: number;
  loading: boolean;
  stepIndex: number;
  stepList: IDrawCanvasInfo[];
  aiLoading: boolean;
  isOperate: boolean;
  children: React.ReactNode;
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

const controlText: ControlTextType = {
  crop: {
    btn: "裁切",
    title: "裁切",
    desc: "",
    icon: "crop-btn",
  },
  expand: {
    btn: "扩图",
    title: "扩图",
    desc: "向外扩展图片，AI将填充图片以外的部分。",
    icon: "expand-btn",
  },
  erase: {
    btn: "擦除",
    title: "擦除",
    desc: "选取想要从图片中移除的物件。",
    icon: "erase-btn",
  },
  "remove-bg": {
    btn: "移除背景",
    title: "移除背景",
    desc: "一键抠出图片中的主体。",
    icon: "remove-bg-btn",
  },
  hd: {
    btn: "提升解析度",
    title: "提升解析度",
    desc: "最大可提升至 3200 x 3200",
    icon: "hd-btn",
  },
  compress: {
    btn: "压缩容量",
    title: "压缩容量",
    desc: "在保证图片质量的基础上，有效降低图片的容量。",
    icon: "compress-btn",
  },
};

const cropControl = [
  {
    label: "原比例",
    value: "original",
    icon: "original",
  },
  {
    label: "1:1",
    value: "1:1",
    icon: "11",
  },
  {
    label: "4:3",
    value: "4:3",
    icon: "43",
  },
  {
    label: "16:9",
    value: "16:9",
    icon: "169",
  },
  {
    label: "9:16",
    value: "9:16",
    icon: "916",
  },
];

const PixProSkin: React.FC<PixProSkinProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>("crop");
  const [rotateAngle, setRotateAngle] = useState(0);
  const [eraserSize, setEraserSize] = useState(50);
  const [cropRationLabel, setCropRationLabel] = useState("original");
  const imageBoxRef = useRef<HTMLDivElement>(null);

  const currentStep = props.stepList[props.stepIndex];
  const resetBtnDisabled = props.stepIndex < 1;
  const forwardBtnDisabled = props.stepIndex >= props.stepList.length - 1;

  const expandImageBtnStatus = currentStep && currentStep.cropBoxHeight === currentStep.fenceMinHeight && currentStep.cropBoxWidth === currentStep.fenceMinWidth && currentStep.xDomOffset === 0 && currentStep.yDomOffset === 0;

  const aiLoadingBoxSize = {
    width: `${currentStep?.cropBoxWidth}px`,
    height: `${currentStep?.cropBoxHeight}px`,
    left: imageBoxRef.current ? `${(imageBoxRef.current.offsetWidth - (currentStep?.cropBoxWidth || 0)) / 2}px` : "0",
    top: imageBoxRef.current ? `${(imageBoxRef.current.offsetHeight - (currentStep?.cropBoxHeight || 0)) / 2}px` : "0",
  };

  useEffect(() => {
    if (currentStep) {
      setCropRationLabel(currentStep.cropRationLabel || "original");
    }
  }, [currentStep]);

  const handleHeaderControl = (type: "reset" | "rollback" | "forward") => {
    if (props.aiLoading) return;
    switch (type) {
      case "reset":
        props.onReset();
        break;
      case "rollback":
        props.onRollback();
        break;
      case "forward":
        props.onForward();
        break;
    }
  };

  const switchTab = (tab: TabType) => {
    if (props.aiLoading) return;
    const oldMode = activeTab;
    setActiveTab(tab);
    props.onSwitchMode({ oldMode, newMode: tab });
    if (tab === "erase") {
      setTimeout(() => {
        props.onSetEraserSize(eraserSize);
      }, 500);
    }
  };

  useEffect(() => {
    if (rotateAngle !== 0) {
      props.onRotate(rotateAngle);
    }
  }, [rotateAngle]);

  useEffect(() => {
    props.onSetEraserSize(eraserSize);
  }, [eraserSize]);

  return (
    <main className="editor-main">
      <div className="pix-pro-container">
        {/* <button title="关闭" className="close-btn close">
          <SvgIcon name="close" />
        </button> */}

        {/* 侧边栏 */}
        <nav>
          <menu className={`${!props.isOperate || props.aiLoading ? "disabled" : ""}`}>
            {Object.entries(controlText).map(([key, value]) => (
              <div key={key} onClick={() => switchTab(key as TabType)} className={activeTab === key ? "active" : ""}>
                <SvgIcon name={value.icon} />
                <span>{value.btn}</span>
              </div>
            ))}
          </menu>
          <figure className="logo">
            <SvgIcon name="logo" />
          </figure>
        </nav>

        {/* 操作区 */}
        {props.isOperate && (
          <div className="controls-container">
            <div className="control-header">
              <h3>{controlText[activeTab].title}</h3>
              {controlText[activeTab].desc && <small>{controlText[activeTab].desc}</small>}
            </div>
            <div className="control-content">
              {/* 裁切和扩图模式 */}
              {(activeTab === "crop" || activeTab === "expand") && (
                <div className="crop">
                  <div className="section">
                    {cropControl.map((item) => (
                      <div key={item.value} className={`icon-btn ${item.value === cropRationLabel ? "active" : ""} ${props.aiLoading ? "disabled" : ""}`} onClick={() => props.onCropRatio(item.value as ICropRatio)}>
                        <SvgIcon name={item.icon} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="section">
                    <div className="size-inputs">
                      <div className="input-group">
                        <label>宽度 (像素)</label>
                        <input type="number" value={props.width} disabled={props.aiLoading} onChange={(e: React.ChangeEvent<HTMLInputElement>) => props.onWidthChange(Number(e.target.value))} onBlur={() => props.onHandleSizeChange("width")} onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && props.onHandleSizeChange("width")} />
                      </div>
                      <div className="input-group">
                        <label>高度 (像素)</label>
                        <input type="number" value={props.height} disabled={props.aiLoading} onChange={(e) => props.onHeightChange(Number(e.target.value))} onBlur={() => props.onHandleSizeChange("height")} onKeyDown={(e) => e.key === "Enter" && props.onHandleSizeChange("height")} />
                      </div>
                    </div>
                  </div>
                  {activeTab === "crop" && (
                    <div className="section flip-btn">
                      <button onClick={() => props.onTurn("left")} title="左翻转" disabled={props.aiLoading}>
                        <SvgIcon name="flip-l" />
                      </button>
                      <button onClick={() => props.onTurn("right")} title="右翻转" disabled={props.aiLoading}>
                        <SvgIcon name="flip-r" />
                      </button>
                      <button onClick={() => props.onFlip("y")} title="上下翻转" disabled={props.aiLoading}>
                        <SvgIcon name="flip-x" />
                      </button>
                      <button onClick={() => props.onFlip("x")} title="左右翻转" disabled={props.aiLoading}>
                        <SvgIcon name="flip-y" />
                      </button>
                    </div>
                  )}
                  {activeTab === "expand" && (
                    <div className="section">
                      <ColoredBtn onClick={props.onExpandImageBtn} loading={props.aiLoading} text="扩展图片" disabled={expandImageBtnStatus} />
                    </div>
                  )}
                </div>
              )}

              {/* 擦除模式 */}
              {activeTab === "erase" && (
                <div className="erase">
                  <div className="section">
                    <EraserSizeSlider value={eraserSize} onChange={setEraserSize} />
                    <ColoredBtn onClick={props.onEraseImage} loading={props.aiLoading} text="清除物件" />
                  </div>
                </div>
              )}

              {/* 移除背景模式 */}
              {activeTab === "remove-bg" && (
                <div className="remove-bg">
                  <div className="section">
                    <ColoredBtn onClick={props.onRemoveBg} loading={props.aiLoading} text="一键移除" />
                  </div>
                </div>
              )}

              {/* HD模式 */}
              {activeTab === "hd" && (
                <div className="hd">
                  <div className="section">
                    <ColoredBtn onClick={props.onHd} loading={props.aiLoading} text="一键提升" />
                  </div>
                </div>
              )}

              {/* 压缩模式 */}
              {activeTab === "compress" && (
                <div className="compress">
                  <div className="section">
                    <ColoredBtn text="一键压缩" loading={props.aiLoading} onClick={() => {}} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 图片区 */}
        <div className="image-container">
          <header className="image-toolbar">
            <div className="toolbar-box">
              <div className={`reset-actions ${resetBtnDisabled || props.aiLoading ? "disabled" : ""}`}>
                <button onClick={() => handleHeaderControl("reset")} className="toolbar-btn">
                  恢复原图
                </button>
              </div>
              <div className="step-actions">
                <span className={resetBtnDisabled || props.aiLoading ? "disabled" : ""}>
                  <button className="toolbar-btn" onClick={() => handleHeaderControl("rollback")}>
                    <SvgIcon name="step" />
                  </button>
                </span>
                <span className={forwardBtnDisabled || props.aiLoading ? "disabled" : ""}>
                  <button className="toolbar-btn flip" onClick={() => handleHeaderControl("forward")}>
                    <SvgIcon name="step" />
                  </button>
                </span>
              </div>
              <div className="confirm-actions">
                <span>
                  <button className="toolbar-btn primary-text">取消</button>
                </span>
                <span className={!props.isOperate || props.aiLoading ? "disabled" : ""}>
                  <button onClick={props.onExportImage} className="toolbar-btn primary">
                    确定
                  </button>
                </span>
              </div>
            </div>
          </header>
          <div className="image-content">
            <div className="image-box" ref={imageBoxRef}>
              {props.aiLoading && <SvgIcon className="image-loading" style={aiLoadingBoxSize} name="loading" size={5} />}
              {props.children}
            </div>
            {activeTab === "crop" && props.isOperate && (
              <div className="image-rotate-box">
                <AngleAdjustment value={rotateAngle} onChange={setRotateAngle} maxAngle={180} />
              </div>
            )}
          </div>
        </div>
      </div>
      {props.loading && (
        <div className="main-loading">
          <span className="loader"></span>
        </div>
      )}
    </main>
  );
};

export default PixProSkin;
