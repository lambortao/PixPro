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
  const [direction, setDirection] = useState<"vertical" | "horizontal">("vertical");
  const [cropRatio, setCropRatio] = useState<ICropRatio>("none");
  const [aiLoading, setAiLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    if (!photoStudioContainer.current) return;

    const studio = new PhotoStudio(photoStudioContainer.current, {
      isDev: false,
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
    imageStudio?.exportImage();
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

  const setEraserSize = (size: number) => {
    imageStudio?.setEraserSize(size);
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

  return (
    <div className="app-container">
      <PixProSkin width={width} height={height} loading={nowLoading} stepIndex={nowStepIndex} stepList={nowStepList} aiLoading={aiLoading} isOperate={isOperate} onWidthChange={setWidth} onHeightChange={setHeight} onRollback={rollback} onForward={forward} onReset={reset} onFlip={flip} onCropRatio={handleCropRatio} onTurn={turn} onRotate={handleRotate} onExportImage={exportImage} onExpandImageBtn={expandImageBtn} onEraseImage={eraseImage} onSetEraserSize={setEraserSize} onRemoveBg={handleRemoveBg} onSwitchMode={handleSwitchMode} onHd={handleHd} onHandleSizeChange={handleSizeChange}>
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
