import React, { useEffect, useRef, useState } from "react";
import "./AiLoading.less";

import SvgIcon from "./SvgIcon";

// 导入图片
import loadingImg from "./assets/image/loading.png";

interface AiLoadingProps {
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

const AiLoading: React.FC<AiLoadingProps> = ({ width = 200, height = 200, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(0);

  // 计算基础缩放比例
  const calculateBaseScale = (width: number, height: number) => {
    const diagonal = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
    return (diagonal / 2000) * 1.2;
  };

  // 更新容器尺寸
  const updateContainerSize = () => {
    if (containerRef.current) {
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      setContainerSize({ width: newWidth, height: newHeight });
      setBaseScale(calculateBaseScale(newWidth, newHeight));
    }
  };

  // 监听容器尺寸变化
  useEffect(() => {
    updateContainerSize();

    const observer = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // 创建动画关键帧
  const generateKeyframes = () => {
    const keyframes = Array.from({ length: 20 }, (_, i) => {
      const progress = i / 19;
      const angle = progress * 2160;
      const scale = 0.8 + Math.abs(Math.sin(progress * Math.PI * 4)) * 0.8;
      const translateX = Math.sin(progress * Math.PI * 6) * 2;
      const translateY = Math.cos(progress * Math.PI * 3) * 3;

      return `
        ${((i / 19) * 100).toFixed(2)}% {
          transform: translate(-50%, -50%) 
            scale(${baseScale * scale}) 
            rotate(${angle}deg)
            translate(${translateX}%, ${translateY}%);
        }
      `;
    }).join("");

    return `@keyframes complexAnimation { ${keyframes} }`;
  };

  return (
    <div className="image-loading" style={style}>
      <div
        className="loader-container"
        ref={containerRef}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
        }}
      >
        <style>{generateKeyframes()}</style>
        <img className="animated-image" src={loadingImg} alt="loading" />
        <SvgIcon name={"loading"} className="center-loading" />
      </div>
    </div>
  );
};

export default AiLoading;
