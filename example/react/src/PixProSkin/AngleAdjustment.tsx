import React, { useState } from "react";
import SvgIcon from "./SvgIcon";
import "./AngleAdjustment.less";

interface AngleAdjustmentProps {
  value: number;
  onChange: (value: number) => void;
  maxAngle: number;
}

const AngleAdjustment: React.FC<AngleAdjustmentProps> = ({ value, onChange, maxAngle }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startAngle, setStartAngle] = useState(0);

  const rulerStyle = {
    height: `${(maxAngle / 3) * 9}px`,
    transform: `translateY(${value * 2.95}px)`,
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.max(-maxAngle / 2, Math.min(maxAngle / 2, value + direction * 5));
    onChange(newValue);
  };

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartAngle(value);
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startY;
    const newAngle = startAngle + Math.round(deltaY / 1.5);
    onChange(Math.max(-maxAngle / 2, Math.min(maxAngle / 2, newAngle)));
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  return (
    <div className="rotate-ruler" onWheel={handleWheel} onMouseDown={startDrag} onMouseMove={handleDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
      <div className="slide-container" style={rulerStyle}>
        <div className="angle-number-box">
          {Array.from({ length: maxAngle / 15 + 1 }).map((_, index) => (
            <span key={index}>{maxAngle / 2 - index * 15}°</span>
          ))}
        </div>
        <div className="angle-scale-box">
          {Array.from({ length: maxAngle / 3 }).map((_, index) => (
            <span key={index} className="angle-scale-item">
              <svg xmlns="http://www.w3.org/2000/svg" width="6" height="2" viewBox="0 0 6 2">
                <path className="PAH8vy" fillRule="nonzero" d="M0 1.478V.48h6v.998z" />
              </svg>
            </span>
          ))}
        </div>
      </div>
      <div className="ruler">
        <SvgIcon name="pointer" />
      </div>
    </div>
  );
};

export default AngleAdjustment;
