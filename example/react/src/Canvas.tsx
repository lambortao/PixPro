import { useEffect, useRef, useState } from "react";
import bgImg from "./bg1.jpg";

const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasWidth] = useState(1500);
  const [canvasHeight] = useState(1000);
  const [canvasStyle] = useState({
    width: 1500,
    height: 1000,
  });

  const canvasRenderStyle = {
    width: `${canvasStyle.width / 2}px`,
    height: `${canvasStyle.height / 2}px`,
  };

  useEffect(() => {
    const img = new Image();
    img.src = bgImg;
    img.onload = () => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasRef.current) {
        ctx.drawImage(img, 0, 0, 3000, 2000, 0, 0, canvasWidth, canvasHeight);
      }
    };
  }, [canvasWidth, canvasHeight]);

  return (
    <div>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} style={canvasRenderStyle} />
    </div>
  );
};

export default Canvas;
