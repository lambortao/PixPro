import { useEffect, useRef, useState } from "react";
import PhotoStudio, { ICropRatio, IDrawCanvasInfo, IImageMode } from "../../../src/index";
import PixProSkin from "./PixProSkin/index";

const App = () => {
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
  const [eraserSize, setEraserSize] = useState({
    min: 20,
    max: 100,
    default: 50,
  });

  useEffect(() => {
    if (!photoStudioContainer.current) return;

    const studio = new PhotoStudio(photoStudioContainer.current, {
      isDev: false,
      token: "",
      merchantId: "",
      host: "",
      routes: "",
      action: {
        extend: "",
        erase: "",
        removeBg: "",
        hd: "",
      },
      onStepChange: ({ stepList, currentStepIndex }: { stepList: IDrawCanvasInfo[]; currentStepIndex: number }) => {
        const step = stepList[currentStepIndex];
        console.log(step);
        setNowStepList(stepList);
        setNowStepIndex(currentStepIndex);
        if (step) {
          setNowStep(step);
          setDirection(step.direction ?? "vertical");
          const ratio = step.cropRatio;
          if (typeof ratio === "string" && (ratio === "none" || ratio === "1:1" || ratio === "4:3" || ratio === "16:9")) {
            setCropRatio(ratio);
          } else {
            setCropRatio("none");
          }
          setWidth(Math.round(step.cropBoxWidth / (step.cdProportions ?? 1)));
          setHeight(Math.round(step.cropBoxHeight / (step.cdProportions ?? 1)));
          setImgCurrentWidth(step.rawImgWidth);
          setImgCurrentHeight(step.rawImgHeight);
        }
        setAiLoading(false);
      },
      onExportImage: (image: string) => {
        setImageSrc(image);
      },
      onFinish: () => {
        setAiLoading(false);
        setNowLoading(false);
      },
      onUpload: () => {
        setNowLoading(true);
        setIsOperate(true);
      },
    });

    setImageStudio(studio);
  }, []);

  const handleSizeChange = (direction: "width" | "height") => {
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
    console.log("回退");
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

  const handleCropRatio = (ratio: ICropRatio) => {
    imageStudio?.cropRatio({
      ratio: ratio === "original" ? 0 : ratio === "1:1" ? 1 : ratio === "4:3" ? 4 / 3 : ratio === "16:9" ? 16 / 9 : ratio === "9:16" ? 9 / 16 : null,
      label: ratio,
    });
  };

  const turn = (direction: "left" | "right") => {
    imageStudio?.turn(direction);
  };

  const handleRotate = (angle: number) => {
    console.log(angle, "angle");

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

  const handleSwitchMode = ({ oldMode, newMode }: { oldMode: string; newMode: string }) => {
    if (oldMode === newMode) return;
    setAiLoading(true);
    imageStudio?.switchMode(oldMode as IImageMode, newMode as IImageMode);
  };

  const handleClose = () => {
    // setIsOperate(false);
    imageStudio?.resetAll();
    setImageSrc("");
  };

  const handleColorChange = (color: string) => {
    imageStudio?.setRemoveBgColor(color);
  };
  // 触发提醒图片的显示和隐藏
  const showRemindImage = (visible: boolean) => {
    imageStudio?.toogleRemindImage(visible);
  };

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
