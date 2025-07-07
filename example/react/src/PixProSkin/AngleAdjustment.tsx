import React, { useState, useRef, useEffect } from "react";
import SvgIcon from "./SvgIcon";
import "./AngleAdjustment.less";

interface AngleAdjustmentProps {
  value: number;
  onChange: (value: number) => void;
  maxAngle: number;
  snapThreshold?: number;
  onHandleRemindImage?: (visible: boolean) => void;
}

const AngleAdjustment: React.FC<AngleAdjustmentProps> = ({ value, onChange, maxAngle, snapThreshold = 1, onHandleRemindImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startAngle, setStartAngle] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false);
  const [speedFactor, setSpeedFactor] = useState(2);
  const containerRef = useRef<HTMLDivElement>(null);
  /** 需要吸附的角度数组，默认只有0度 */
  const snapAngles = [-90, -60, -45, -30, -15, 0, 15, 30, 45, 60, 90];

  const rulerStyle = {
    height: `${(maxAngle / 3) * 9}px`,
    transform: `translateY(${value * 3}px)`,
    transition: isSnapping ? "transform 200ms ease-out" : "none",
  };

  const checkSnap = (angle: number): number => {
    for (const snapAngle of snapAngles) {
      if (Math.abs(angle - snapAngle) <= snapThreshold) {
        setIsSnapping(true);
        setTimeout(() => {
          setIsSnapping(false);
        }, 200);
        return snapAngle;
      }
    }

    setIsSnapping(false);
    return angle;
  };

  const handleWheel = (e: any) => {
    e.preventDefault();

    let step = Math.abs(value) <= snapThreshold ? 6 : 3;
    step = step / speedFactor;
    const direction = e.deltaY > 0 ? -1 : 1;
    let newValue = Math.max(-maxAngle / 2, Math.min(maxAngle / 2, value + direction * step));
    const snappedAngle = checkSnap(newValue);
    if (snappedAngle !== newValue) {
      onChange(snappedAngle);
    } else {
      onChange(newValue);
    }
  };
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
  }, [value, maxAngle, snapThreshold, speedFactor, onChange, onHandleRemindImage]);

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

    const snappedAngle = checkSnap(boundedAngle);
    onChange(snappedAngle);
  };

  const stopDrag = () => {
    if (isDragging) {
      onHandleRemindImage?.(false);
    }
    setIsDragging(false);
  };

  return (
    <div className="rotate-ruler" ref={containerRef} onMouseDown={startDrag} onMouseMove={handleDrag} onMouseUp={stopDrag} onMouseLeave={stopDrag}>
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
