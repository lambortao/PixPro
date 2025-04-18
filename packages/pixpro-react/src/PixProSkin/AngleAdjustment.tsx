import React, { useState } from "react";
import SvgIcon from "./SvgIcon";
import "./AngleAdjustment.less";

interface AngleAdjustmentProps {
  value: number;
  onChange: (value: number) => void;
  maxAngle: number;
  snapThreshold?: number;
  onHandleRemindImage?: (visible: boolean) => void;
}

const AngleAdjustment: React.FC<AngleAdjustmentProps> = ({ value, onChange, maxAngle, snapThreshold = 5, onHandleRemindImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startAngle, setStartAngle] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);

  const rulerStyle = {
    height: `${(maxAngle / 3) * 9}px`,
    transform: `translateY(${value * 3}px)`,
    transition: isSnapping ? "transform 200ms ease-out" : "none",
  };

  const checkSnap = (angle: number, shouldSnap: boolean = false, dragDistance: number = 0): number => {
    if (shouldSnap && dragDistance > 3 && Math.abs(angle) <= 3) {
      setIsSnapping(true);
      setTimeout(() => {
        setIsSnapping(false);
      }, 200);
      return 0;
    }
    setIsSnapping(false);
    return angle;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const step = Math.abs(value) <= 1 ? 6 : 3;
    const direction = e.deltaY > 0 ? -1 : 1;
    let newValue = Math.max(-maxAngle / 2, Math.min(maxAngle / 2, value + direction * step));

    if (Math.abs(newValue) <= 1) {
      newValue = 0;
      setIsSnapping(true);
      setTimeout(() => setIsSnapping(false), 200);
    }

    onHandleRemindImage?.(true);
    onChange(newValue);
  };

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartAngle(value);
    onHandleRemindImage?.(true);
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaY = startY - e.clientY;

    const newAngle = startAngle - Math.round(deltaY / 3);
    const boundedAngle = Math.max(-maxAngle / 2, Math.min(maxAngle / 2, newAngle));
    const dragDistance = Math.abs(boundedAngle - startAngle);

    const snappedAngle = checkSnap(boundedAngle, true, dragDistance);
    onChange(snappedAngle);
  };

  const stopDrag = () => {
    if (isDragging) {
      onHandleRemindImage?.(false);
    }
    setIsDragging(false);
  };

  return (
    <div className="rotate-ruler" onWheel={handleWheel} onMouseDown={startDrag} onMouseMove={handleDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
      <div className="slide-container" style={rulerStyle}>
        <div className="ruler-content">
          <div className="ruler-scale">
            {Array.from({ length: maxAngle / 3 + 1 }).map((_, index) => (
              <div key={index} className="scale-row">
                <div className="number-cell">{index % 5 === 0 && <span>{index * 3 - maxAngle / 2}°</span>}</div>
                <div className={`scale-cell ${index % 5 === 0 ? "major-scale" : ""}`}>
                  <div className="scale-line"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="ruler-pointer">
        <SvgIcon name="pointer" />
      </div>
    </div>
  );
};

export default AngleAdjustment;
