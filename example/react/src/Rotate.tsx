import { useState } from "react";
import "./Rotate.css";

interface ImageSize {
  width: number;
  height: number;
}

interface ImagePosition {
  x: number;
  y: number;
}

const Rotate = () => {
  const [angle, setAngle] = useState(0);
  const [showCalculation, setShowCalculation] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSize>({ width: 400, height: 240 });
  const [imagePosition, setImagePosition] = useState<ImagePosition>({ x: 0, y: 0 });
  const [debug, setDebug] = useState(false);

  const cropBoxWidth = 200;
  const cropBoxHeight = 120;

  const diagonal = Math.sqrt(Math.pow(cropBoxWidth, 2) + Math.pow(cropBoxHeight, 2));
  const safeDistanceX = (diagonal - cropBoxWidth) / 2;
  const safeDistanceY = (diagonal - cropBoxHeight) / 2;

  const isInSafeArea = (width: number, height: number, x: number, y: number) => {
    if (y < safeDistanceY) return false;
    if (x < safeDistanceX) return false;
    if (height < cropBoxHeight + y + safeDistanceY) return false;
    if (width < cropBoxWidth + x + safeDistanceX) return false;
    return true;
  };

  const calculateRotationScale = (width: number, height: number, angle: number) => {
    const radian = (angle * Math.PI) / 180;
    const cos = Math.abs(Math.cos(radian));
    const sin = Math.abs(Math.sin(radian));

    const rotatedWidth = width * cos + height * sin;
    const rotatedHeight = height * cos + width * sin;

    const scaleX = rotatedWidth / width;
    const scaleY = rotatedHeight / height;

    return Math.max(scaleX, scaleY);
  };

  const scale = isInSafeArea(imageSize.width, imageSize.height, imagePosition.x, imagePosition.y) ? 1 : calculateRotationScale(cropBoxWidth, cropBoxHeight, angle);

  const setImageSizeHandler = (size: ImageSize) => {
    setImageSize(size);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex gap-6">
        <div className="flex-1">
          <div className="space-y-4 mb-4 relative z-10">
            <div>
              <label className="block text-sm font-medium mb-2">旋转角度：{angle}°</label>
              <input type="range" min="0" max="360" value={angle} onChange={(e) => setAngle(Number(e.target.value))} className="w-full" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                图片尺寸：{imageSize.width} x {imageSize.height}
              </label>
              <div className="flex gap-2">
                <button onClick={() => setImageSizeHandler({ width: 200, height: 120 })} className="px-3 py-1 bg-gray-200 rounded text-sm">
                  与裁切框相同
                </button>
                <button onClick={() => setImageSizeHandler({ width: 400, height: 240 })} className="px-3 py-1 bg-gray-200 rounded text-sm">
                  2倍大小
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">图片位置调整</label>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs mb-1">X 偏移: {imagePosition.x}px</label>
                  <input type="range" min="0" max={imageSize.width - cropBoxWidth} value={imagePosition.x} onChange={(e) => setImagePosition({ ...imagePosition, x: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-xs mb-1">Y 偏移: {imagePosition.y}px</label>
                  <input type="range" min="0" max={imageSize.height - cropBoxHeight} value={imagePosition.y} onChange={(e) => setImagePosition({ ...imagePosition, y: Number(e.target.value) })} className="w-full" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="debug" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
              <label htmlFor="debug" className="text-sm">
                显示辅助线
              </label>
            </div>
          </div>

          <div className="relative bg-gray-100 w-[600px] h-[600px] border border-gray-300">
            <div
              className="absolute border-2 border-blue-500"
              style={{
                width: `${cropBoxWidth}px`,
                height: `${cropBoxHeight}px`,
                left: `${imagePosition.x}px`,
                top: `${imagePosition.y}px`,
              }}
            />

            <div
              className="absolute bg-gray-400/20 border border-red-500 transition-all duration-300"
              style={{
                width: `${imageSize.width}px`,
                height: `${imageSize.height}px`,
                left: "0px",
                top: "0px",
                transformOrigin: `${cropBoxWidth / 2 + imagePosition.x}px ${cropBoxHeight / 2 + imagePosition.y}px`,
                transform: `rotate(${angle}deg) scale(${scale})`,
              }}
            >
              <img src="/api/placeholder/800/480" alt="Demo" className="w-full h-full object-cover opacity-50" />
            </div>

            {debug && (
              <div
                className="absolute border border-green-500 rounded-full"
                style={{
                  width: `${diagonal}px`,
                  height: `${diagonal}px`,
                  left: `${imagePosition.x + cropBoxWidth / 2 - diagonal / 2}px`,
                  top: `${imagePosition.y + cropBoxHeight / 2 - diagonal / 2}px`,
                }}
              />
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4 relative z-10">
          {showCalculation && (
            <div className="prose">
              <h3>安全距离计算：</h3>
              <ul className="list-disc list-inside">
                <li>X轴安全距离: {safeDistanceX.toFixed(1)}px</li>
                <li>Y轴安全距离: {safeDistanceY.toFixed(1)}px</li>
                <li>当前是否在安全区域: {isInSafeArea(imageSize.width, imageSize.height, imagePosition.x, imagePosition.y) ? "是" : "否"}</li>
                <li>当前缩放比例: {scale.toFixed(4)}</li>
              </ul>
            </div>
          )}
          <button onClick={() => setShowCalculation(!showCalculation)} className="px-4 py-2 bg-blue-500 text-white rounded">
            {showCalculation ? "隐藏计算过程" : "显示计算过程"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Rotate;
