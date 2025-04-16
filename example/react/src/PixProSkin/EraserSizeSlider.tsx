import React, { useRef, useState, useEffect } from "react";
import "./EraserSizeSlider.css";

interface EraserSizeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

const EraserSizeSlider: React.FC<EraserSizeSliderProps> = ({ value, onChange, min = 20, max = 100 }) => {
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorCircleRef = useRef<HTMLDivElement>(null);

  const updateCirclePosition = () => {
    if (!inputRef.current || !cursorCircleRef.current) return;

    const input = inputRef.current;
    const rect = input.getBoundingClientRect();
    const thumbWidth = 16;
    const range = max - min;
    const percentage = (value - min) / range;

    const thumbPosition = rect.left + (rect.width - thumbWidth) * percentage + thumbWidth / 2;

    cursorCircleRef.current.style.left = `${thumbPosition}px`;
    cursorCircleRef.current.style.top = `${rect.top + rect.height / 2}px`;
  };

  useEffect(() => {
    if (isHovering) {
      updateCirclePosition();
      window.addEventListener("resize", updateCirclePosition);
    }
    return () => window.removeEventListener("resize", updateCirclePosition);
  }, [isHovering, value]);

  return (
    <div style={{ paddingBottom: "20px" }}>
      <small>橡皮擦大小</small>
      <input
        ref={inputRef}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          background: `linear-gradient(to right, #4878ef 0%, #4878ef ${((value - min) / (max - min)) * 100}%, #e0e0e0 ${((value - min) / (max - min)) * 100}%, #e0e0e0 100%)`,
        }}
      />
      {isHovering && (
        <div
          ref={cursorCircleRef}
          style={{
            position: "fixed",
            width: `${value}px`,
            height: `${value}px`,
            borderRadius: "50%",
            backgroundColor: "#4878ef",
            opacity: 0.3,
            pointerEvents: "none",
            zIndex: 12,
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );
};

export default EraserSizeSlider;
