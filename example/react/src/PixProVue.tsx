import { useEffect, useRef, useState } from "react";
import PhotoStudio, { type ICropRatio, type IDrawCanvasInfo, type IImageMode } from "../../../src/index";
import PixProSkin from "./PixProSkin/index";
type propsType = {
  /** 用户 token */
  token: string;
  /** 请求 host */
  host: string;
  /** 裁剪比例 */
  cropRatios?: Record<string, number>;
  /** 初始图片 */
  fitstImage?: File | null;
  /** 开启下载按钮 */
  showDownloadBtn?: boolean;
  /** 请求 routes */
  routes?: string;
  /** 橡皮擦大小 */
  eraserSize?: {
    min: number;
    max: number;
    default: number;
  };
  onClose: () => void;
  onExportImage: (image: string) => void;
};
const App = (props: propsType) => {
  const photoStudioContainer = useRef<HTMLDivElement>(null);
  const [imageStudio, setImageStudio] = useState<PhotoStudio | null>(null);
  const [nowLoading, setNowLoading] = useState(false);
  const [isOperate, setIsOperate] = useState(false);
  const [nowStep, setNowStep] = useState<IDrawCanvasInfo | null>(null);
  const [nowStepList, setNowStepList] = useState<IDrawCanvasInfo[]>([]);
  const [nowStepIndex, setNowStepIndex] = useState(-1);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [imgCurrentWidth, setImgCurrentWidth] = useState(0);
  const [imgCurrentHeight, setImgCurrentHeight] = useState(0);
  const [direction, setDirection] = useState<"vertical" | "horizontal">("vertical");
  const [cropRatio, setCropRatio] = useState<ICropRatio>("none");
  const [aiLoading, setAiLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [eraserSize, setEraserSize] = useState(
    props.eraserSize ?? {
      min: 20,
      max: 100,
      default: 50,
    }
  );
  const [defaultEraserSize, setDefaultEraserSize] = useState(props.eraserSize?.default);
  const [realTimeStep, setRealTimeStep] = useState<IDrawCanvasInfo | null>(null);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [disabledForm, setDisabledForm] = useState(false);
  const [nowMode, setNowMode] = useState<string>("crop");
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    if (!photoStudioContainer.current) return;
    console.log(photoStudioContainer.current, "photoStudioContainer.current");

    console.log('("---------------------");');

    const studio = new PhotoStudio(photoStudioContainer.current!, {
      token: props.token,
      merchantId: "",
      isDev: false,
      host: props.host,
      routes: props.routes ?? "/image/processing",
      eraserSize: eraserSize,
      action: {
        extend: "ImageExpansion",
        erase: "LocalizedImageRemoval",
        removeBg: "BackgroundRemoval",
        hd: "EnhanceImageResolution",
      },
      realTimeChange: (step: IDrawCanvasInfo) => {
        /** 实时计算宽高 */
        const { currentWidth, currentHeight } = getWH(step);
        setWidth(currentWidth);
        setHeight(currentHeight);
        setRealTimeStep(step);
        setDisabledForm(step.disabledForm ?? false);
        setImgCurrentWidth(step.currentDomWidth / (step.cdProportions ?? 1));
        setImgCurrentHeight(step.currentDomHeight / (step.cdProportions ?? 1));
      },
      onStepChange: ({ stepList, currentStepIndex }: { stepList: IDrawCanvasInfo[]; currentStepIndex: number }) => {
        const step = stepList[currentStepIndex];
        setNowStepList(stepList);
        setNowStepIndex(currentStepIndex);

        if (step) {
          setNowStep(step);
          setDirection(step.direction ?? "vertical");
          // const ratio = step.cropRatio;
          // if (typeof ratio === "string" && (ratio === "none" || ratio === "1:1" || ratio === "4:3" || ratio === "16:9")) {
          //   setCropRatio(ratio);
          // } else {
          //   setCropRatio("none");
          // }
          const { currentWidth, currentHeight } = getWH(step);
          setWidth(currentWidth);
          setHeight(currentHeight);
          setImgCurrentWidth(step.currentDomWidth / (step.cdProportions ?? 1));
          setImgCurrentHeight(step.currentDomHeight / (step.cdProportions ?? 1));
        }
        setTimeout(() => {
          setAiLoading(false);
          setNowLoading(false);
          setDisabledForm(step.disabledForm ?? false);
        }, 300);
      },
      onExportImage: (image: string) => {
        setImageSrc(image);
      },
      onFinish: () => {
        setAiLoading(false);
        setNowLoading(false);
        // 初始化时自动触发裁剪比例
        if (!isInit) {
          setIsInit(true);
          if (props.cropRatios && Object.keys(props.cropRatios).length === 1) {
            const ratio = props.cropRatios[Object.keys(props.cropRatios)[0]];
            handleCropRatio({ ratio, label: Object.keys(props.cropRatios)[0], isTrigger: false });
          }
        }
      },
      onUpload: () => {
        setNowLoading(true);
        setIsOperate(true);
      },
      onEraserSizeChange: (size: number) => {
        setEraserSize((prev) => ({ ...prev, default: size }));
        setDefaultEraserSize(size);
      },
    });

    setImageStudio(studio);
    // 初始化时上传图片
    setTimeout(() => {
      if (props.fitstImage) {
        studio.uploadFile(props.fitstImage);
      }
    }, 0);
  }, []);

  const handleSizeChange = (direction: "width" | "height") => {
    console.log(direction, "direction");
    console.log(width, height, "direction");
    imageStudio?.setWidthAndHeight(width, height, direction);
  };

  const exportImage = () => {
    // exportImage()
    imageStudio?.downloadImage();
  };

  const rotate = (angle: number) => {
    imageStudio?.rotate(angle);
  };

  const rollback = () => {
    imageStudio?.rollback();
  };

  const forward = () => {
    imageStudio?.forward();
  };

  const reset = () => {
    imageStudio?.reset();
  };

  const flip = (direction: "x" | "y") => {
    imageStudio?.flip(direction);
  };

  const handleCropRatio = (ratio: { ratio: number | null; label: string; isTrigger?: boolean }) => {
    imageStudio?.cropRatio(ratio);
  };

  const turn = (direction: "left" | "right") => {
    imageStudio?.turn(direction);
  };

  const handleRotate = (angle: number) => {
    rotate(Number(angle));
  };

  const expandImageBtn = () => {
    setAiLoading(true);
    imageStudio?.expandImageBtn();
  };

  const eraseImage = () => {
    setAiLoading(true);
    imageStudio?.eraseImage();
  };

  const handleEraserSizeChange = (size: number) => {
    imageStudio?.setEraserSize(size);
    setEraserSize((prev) => ({ ...prev, default: size }));
  };

  const handleRemoveBg = () => {
    setAiLoading(true);
    imageStudio?.removeBg();
  };

  const handleHd = () => {
    setAiLoading(true);
    imageStudio?.hd();
  };

  const handleDownloadImage = async () => {
    setButtonLoading(true);
    await imageStudio?.downloadImage();
    setButtonLoading(false);
  };

  const handleSwitchMode = ({ oldMode, newMode }: { oldMode: string; newMode: string }) => {
    if (oldMode === newMode) return;
    setNowMode(newMode);
    imageStudio?.switchMode(oldMode as IImageMode, newMode as IImageMode);
    if (oldMode === "crop" || newMode === "erase" || oldMode === "remove-bg") {
      setNowLoading(true);
    }
  };

  const handleClose = () => {
    // setIsOperate(false);
    imageStudio?.resetAll();
    setImageSrc("");
    props.onClose();
  };

  const handleColorChange = (color: string) => {
    imageStudio?.setRemoveBgColor(color);
  };
  // 触发提醒图片的显示和隐藏
  const showRemindImage = (visible: boolean) => {
    imageStudio?.toogleRemindImage(visible);
  };

  /**
   * 获取实时的宽高
   */
  function getWH(step: IDrawCanvasInfo) {
    const wMultiplied = step.currentDomWidth / step.cropBoxWidth;
    const hMultiplied = step.currentDomHeight / step.cropBoxHeight;
    return {
      currentWidth: Math.round(step.rawImgWidth / (wMultiplied ?? 1)),
      currentHeight: Math.round(step.rawImgHeight / (hMultiplied ?? 1)),
    };
  }

  return (
    <div className="app-container">
      <PixProSkin
        width={width}
        height={height}
        imgCurrentWidth={imgCurrentWidth}
        imgCurrentHeight={imgCurrentHeight}
        loading={nowLoading}
        stepIndex={nowStepIndex}
        stepList={nowStepList}
        aiLoading={aiLoading}
        isOperate={isOperate}
        eraserSize={eraserSize}
        cropRatios={props.cropRatios}
        showDownloadBtn={props.showDownloadBtn || false}
        disabledForm={disabledForm}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onRollback={rollback}
        onForward={forward}
        onReset={reset}
        onFlip={flip}
        onCropRatio={handleCropRatio}
        onTurn={turn}
        onRotate={handleRotate}
        onExportImage={exportImage}
        onExpandImageBtn={expandImageBtn}
        onEraseImage={eraseImage}
        onSetEraserSize={handleEraserSizeChange}
        onRemoveBg={handleRemoveBg}
        onSwitchMode={handleSwitchMode}
        onHd={handleHd}
        onHandleSizeChange={handleSizeChange}
        onHandleClose={handleClose}
        onColorChange={handleColorChange}
        onShowRemindImage={showRemindImage}
      >
        <div className="box" ref={photoStudioContainer} />
      </PixProSkin>

      {imageSrc && (
        <div className="export-img-box" onClick={() => setImageSrc("")}>
          <img src={imageSrc} alt="" />
        </div>
      )}
    </div>
  );
};

export default App;
