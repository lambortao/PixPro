import React, { useState, useRef, useEffect, useMemo } from "react";

import { ICropRatio, IDrawCanvasInfo } from "../../../../src/index";

import SvgIcon from "./SvgIcon";

// 旋转尺子

import AngleAdjustment from "./AngleAdjustment";

// 特殊操作按钮

import ColoredBtn from "./ColoredBtn";

// 滑动器

import EraserSizeSlider from "./EraserSizeSlider";

// 自定义颜色

import AddNewColor from "./AddNewColor";

// AI加载动画
import AiLoading from "./AiLoading";

import "./assets/style/index.less";

// 新增

import useProgressBar from "./hooks/useProgressBar.tsx";

import useColors from "./hooks/useColors";

import { controlTextData, cropControlData } from "./hooks/config.ts";

import { TabType, MIN_REMOVE_BG_WIDTH, MIN_REMOVE_BG_HEIGHT, MAX_HD_IMAGE_WIDTH, MAX_HD_IMAGE_HEIGHT, MIN_HD_IMAGE_WIDTH, MIN_HD_IMAGE_HEIGHT, MIN_EXPAND_IMAGE_WIDTH, MIN_EXPAND_IMAGE_HEIGHT, MAX_EXPAND_IMAGE_WIDTH, MAX_EXPAND_IMAGE_HEIGHT, MIN_ERASE_IMAGE_WIDTH, MIN_ERASE_IMAGE_HEIGHT, MAX_ERASE_IMAGE_WIDTH, MAX_ERASE_IMAGE_HEIGHT } from "./types";

interface PixProSkinProps {
  width: number;

  height: number;

  imgCurrentWidth: number;

  imgCurrentHeight: number;

  loading: boolean;

  stepIndex: number;

  stepList: IDrawCanvasInfo[];

  aiLoading: boolean;

  isOperate: boolean;

  eraserSize: {
    min: number;

    max: number;

    default: number;
  };

  cropRatios?: Record<string, number>;

  showDownloadBtn: boolean;

  disabledForm: boolean;

  children: React.ReactNode;

  onWidthChange: (width: number) => void;

  onHeightChange: (height: number) => void;

  onRollback: () => void;

  onForward: () => void;

  onReset: () => void;

  onFlip: (direction: "x" | "y") => void;

  onCropRatio: (ratio: { ratio: number | null; label: string; isTrigger?: boolean }) => void;

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

  onHandleClose: () => void;

  onColorChange: (color: string) => void;

  onShowRemindImage: (visible: boolean) => void;
}

const PixProSkin: React.FC<PixProSkinProps> = (props) => {
  const [activeTab, setActiveTab] = useState<TabType>("crop");

  const [rotateAngle, setRotateAngle] = useState(0);

  const [eraserDefaultSize, setEraserSize] = useState(props.eraserSize?.default ?? 50);

  const [cropRationLabel, setCropRationLabel] = useState("original");

  const [currentColor, setCurrentColor] = useState("transparent");

  const imageBoxRef = useRef<HTMLDivElement>(null);

  // 进度条状态

  const { showProgressBar, progress } = useProgressBar({ loading: props.loading });

  const currentStep = props.stepList[props.stepIndex];

  const resetBtnDisabled = props.stepIndex < 1;

  const forwardBtnDisabled = props.stepIndex >= props.stepList.length - 1;

  const cropRatios = props.cropRatios || cropControlData;

  // 裁剪比例

  const showCropRatios = Object.keys(cropRatios).length > 1;

  // 菜单背景色块位置计算

  const menuBgStyle = useMemo(() => {
    const menuItems = Object.keys(controlTextData);

    const activeIndex = menuItems.indexOf(activeTab);

    // 菜单项高度 (12px * 2 + 20px)

    const itemHeight = 44;

    // 菜单项间距

    const itemMargin = 5;

    const top = activeIndex * (itemHeight + itemMargin);

    return {
      transform: `translateY(${top}px)`,
    };
  }, [activeTab]);

  // 裁切比例背景色块位置计算

  const ratioBgStyle = useMemo(() => {
    if (!cropRationLabel || cropRationLabel === "none") {
      return {
        opacity: 0,
      };
    }

    const ratioItems = Object.keys(cropRatios);

    const activeIndex = ratioItems.indexOf(cropRationLabel);

    if (activeIndex === -1) {
      return {
        transform: `translateY(${0}px)`,

        backgroundColor: "#e6e6e6",
      };
    }

    const itemHeight = 36;

    const itemMargin = 5;

    const top = activeIndex * (itemHeight + itemMargin);

    return {
      transform: `translateY(${top}px)`,

      backgroundColor: "#e6e6e6",

      opacity: 1,
    };
  }, [cropRationLabel]);

  // 按钮禁用状态计算

  const expandImageBtnStatus = currentStep && currentStep.cropBoxHeight === currentStep.fenceMinHeight && currentStep.cropBoxWidth === currentStep.fenceMinWidth && currentStep.xDomOffset === 0 && currentStep.yDomOffset === 0;

  // 各功能是否可用检查

  const allowRemoveBg = props.width > MIN_REMOVE_BG_WIDTH && props.height > MIN_REMOVE_BG_HEIGHT;

  const allowHd = props.width > MIN_HD_IMAGE_WIDTH && props.height > MIN_HD_IMAGE_HEIGHT && props.width < MAX_HD_IMAGE_WIDTH && props.height < MAX_HD_IMAGE_HEIGHT;

  /** 图片尺寸小于最小扩图尺寸 */
  const tooSmallExpand = (props.imgCurrentWidth ?? 0) < MIN_EXPAND_IMAGE_WIDTH || (props.imgCurrentHeight ?? 0) < MIN_EXPAND_IMAGE_HEIGHT;
  const tooLargeExpand = (props.imgCurrentWidth ?? 0) > MAX_EXPAND_IMAGE_WIDTH || (props.imgCurrentHeight ?? 0) > MAX_EXPAND_IMAGE_HEIGHT;

  const allowErase = props.width > MIN_ERASE_IMAGE_WIDTH && props.height > MIN_ERASE_IMAGE_HEIGHT && props.width < MAX_ERASE_IMAGE_WIDTH && props.height < MAX_ERASE_IMAGE_HEIGHT;

  // 清除物件按钮是否禁用

  const eraseImageBtnDisabled = !!currentStep?.erasePoints?.length;

  const aiLoadingBoxSize = {
    width: `${currentStep?.cropBoxWidth}px`,

    height: `${currentStep?.cropBoxHeight}px`,

    left: imageBoxRef.current ? `${(imageBoxRef.current.offsetWidth - (currentStep?.cropBoxWidth || 0)) / 2}px` : "0",

    top: imageBoxRef.current ? `${(imageBoxRef.current.offsetHeight - (currentStep?.cropBoxHeight || 0)) / 2}px` : "0",
  };

  useEffect(() => {
    if (currentStep) {
      if (activeTab === "crop" || activeTab === "expand" || !cropRationLabel) {
        setCropRationLabel(currentStep.cropRationLabel || "original");
      }

      setCurrentColor(currentStep.bgColor || "transparent");
    }
  }, [currentStep, activeTab]);

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
        props.onSetEraserSize(eraserDefaultSize);
      }, 500);
    }
  };

  useEffect(() => {
    props.onRotate(rotateAngle);
  }, [rotateAngle]);

  useEffect(() => {
    props.onSetEraserSize(eraserDefaultSize);
  }, [eraserDefaultSize]);

  // 处理颜色变化

  const handleColorChange = (color: string) => {
    setCurrentColor(color);

    props.onColorChange(color);
  };

  const { colorBoxVisible, localColorList, allColorsList, removeLocalColorStorage, handleAddNewColor, openColorBox } = useColors(handleColorChange, currentColor);

  // 获取比例图标样式

  const getRatioStyle = (ratio: number): React.CSSProperties => {
    const MAX_SIZE = 17;
    const BORDER_WIDTH = 2;
    const BORDER_RADIUS = 3;
    let width, height;
    if (ratio >= 1) {
      width = MAX_SIZE;
      height = MAX_SIZE / ratio;
    } else {
      height = MAX_SIZE;
      width = MAX_SIZE * ratio;
    }
    return {
      display: "inline-block",
      width: `${width}px`,
      height: `${height}px`,
      border: `${BORDER_WIDTH}px solid`,
      borderRadius: `${BORDER_RADIUS}px`,
      boxSizing: "border-box",
    };
  };

  return (
    <main className="editor-main">
      <div className="pix-pro-container">
        {/* 侧边栏 */}

        <nav>
          <menu className={`${!props.isOperate || props.aiLoading ? "disabled" : ""}`}>
            <span className="menu-bg" style={menuBgStyle}></span>

            {Object.entries(controlTextData).map(([key, value]: any) => (
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
              <h3>{controlTextData[activeTab].title}</h3>

              {controlTextData[activeTab].desc && <small>{controlTextData[activeTab].desc}</small>}
            </div>

            <div className="control-content">
              {/* 裁切和扩图模式 */}

              {(activeTab === "crop" || activeTab === "expand") && (
                <div className="crop">
                  {showCropRatios && (
                    <div className="section">
                      <div className="ratio-bg" style={ratioBgStyle}></div>

                      {Object.entries(cropRatios).map(([key, value]) => (
                        <div key={key} className={`icon-btn ${key === cropRationLabel ? "active" : ""} ${props.aiLoading ? "disabled" : ""}`} onClick={() => props.onCropRatio({ ratio: value, label: key })}>
                          {key === "original" ? (
                            <>
                              <SvgIcon name="original" />

                              <span>原比例</span>
                            </>
                          ) : (
                            <>
                              <figure>
                                <i style={getRatioStyle(value)}></i>
                              </figure>

                              <span>{key}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="section" style={{ marginTop: showCropRatios ? "0" : "10px" }}>
                    <div className="size-inputs">
                      <div className="input-group">
                        <label>宽度 (像素)</label>
                        <input type="number" value={props.width} disabled={props.aiLoading} onChange={(e) => props.onWidthChange(Number(e.target.value))} onBlur={() => props.onHandleSizeChange("width")} onKeyDown={(e) => e.key === "Enter" && props.onHandleSizeChange("width")} />
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
                      <ColoredBtn onClick={props.onExpandImageBtn} loading={props.aiLoading} text="一键扩展" disabled={expandImageBtnStatus || props.aiLoading || tooSmallExpand || tooLargeExpand} />

                      {tooSmallExpand && (
                        <p className="error-text">
                          图片分辨率需大于 {MIN_EXPAND_IMAGE_WIDTH} x {MIN_EXPAND_IMAGE_HEIGHT}
                        </p>
                      )}
                      {tooLargeExpand && (
                        <p className="error-text">
                          图片分辨率需小于 {MAX_EXPAND_IMAGE_WIDTH} x {MAX_EXPAND_IMAGE_HEIGHT}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 擦除模式 */}

              {activeTab === "erase" && (
                <div className="erase">
                  <div className="section">
                    <EraserSizeSlider value={eraserDefaultSize} onChange={setEraserSize} min={props.eraserSize?.min} max={props.eraserSize?.max} />

                    <ColoredBtn onClick={props.onEraseImage} loading={props.aiLoading} text="一键擦除" disabled={!eraseImageBtnDisabled || !allowErase} />

                    {!allowErase && (
                      <small>
                        图片分辨率需大于 {MIN_ERASE_IMAGE_WIDTH} x {MIN_ERASE_IMAGE_HEIGHT} 且小于 {MAX_ERASE_IMAGE_WIDTH} x {MAX_ERASE_IMAGE_HEIGHT} 才能擦除。
                      </small>
                    )}
                  </div>
                </div>
              )}

              {/* 移除背景模式 */}

              {activeTab === "remove-bg" && (
                <div className="remove-bg">
                  <div className="section">
                    <ColoredBtn onClick={props.onRemoveBg} loading={props.aiLoading} text="一键移除" disabled={!allowRemoveBg} />

                    {!allowRemoveBg && (
                      <small>
                        宽低于 {MIN_REMOVE_BG_WIDTH}px 或高低于 {MIN_REMOVE_BG_HEIGHT}px，无法一键移除背景。
                      </small>
                    )}

                    <span className="line"></span>

                    <div className="color-list">
                      <small>背景颜色</small>

                      <div className="color-box">
                        {allColorsList.map((color) => (
                          <div key={color} className={`color-item ${color === currentColor ? "active" : ""} ${color === "transparent" ? "transparent" : ""}`} onClick={() => handleColorChange(color)}>
                            <span style={{ backgroundColor: color }}></span>

                            {localColorList.includes(color) && color !== currentColor && (
                              <div
                                onClick={(e: any) => {
                                  e.stopPropagation();

                                  removeLocalColorStorage(color);
                                }}
                              >
                                <SvgIcon className="close-icon" name="close" />
                              </div>
                            )}
                          </div>
                        ))}

                        <AddNewColor value={colorBoxVisible} onChange={handleAddNewColor} onOpen={openColorBox} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HD模式 */}

              {activeTab === "hd" && (
                <div className="hd">
                  <div className="section">
                    <ColoredBtn onClick={props.onHd} loading={props.aiLoading} text="一键提升" disabled={!allowHd} />

                    {!allowHd && (
                      <small>
                        图片分辨率需大于 {MIN_HD_IMAGE_WIDTH} x {MIN_HD_IMAGE_HEIGHT} 且小于 {MAX_HD_IMAGE_WIDTH} x {MAX_HD_IMAGE_HEIGHT} 才能提升解析度。
                      </small>
                    )}
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
            <div className="toolbar-status">
              {!!props.width && !!props.height && (
                <span>
                  当前图片分辨率：{props.width} x {props.height}
                </span>
              )}
            </div>

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
                  <button className="toolbar-btn primary-text" onClick={props.onHandleClose}>
                    取消
                  </button>
                </span>

                {props.showDownloadBtn && (
                  <span className={!props.isOperate || props.aiLoading ? "disabled" : ""}>
                    <button onClick={props.onExportImage} className="toolbar-btn primary">
                      下载
                    </button>
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="image-content">
            <div className="image-box" ref={imageBoxRef}>
              {props.aiLoading && <AiLoading style={aiLoadingBoxSize} width={currentStep?.cropBoxWidth} height={currentStep?.cropBoxHeight} />}

              {props.children}

              {/* 进度条 */}

              {showProgressBar && (
                <div className="main-loading">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ transform: `scaleX(${progress / 100})` }} />
                  </div>

                  <div className="progress-percentage">{Math.floor(progress)}%</div>
                </div>
              )}
            </div>

            {activeTab === "crop" && props.isOperate && (
              <div className="image-rotate-box">
                <AngleAdjustment value={rotateAngle} onChange={setRotateAngle} maxAngle={180} onHandleRemindImage={props.onShowRemindImage} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 透明全屏遮罩，阻止用户操作 */}

      {props.loading && <div className="full-screen-blocker"></div>}
    </main>
  );
};

export default PixProSkin;
