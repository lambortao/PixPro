import React from "react";
import "./EraserSizeSlider.css";

interface EraserSizeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const EraserSizeSlider: React.FC<EraserSizeSliderProps> = ({ value, onChange }) => {
  return (
    <div>
      <small>橡皮擦大小</small>
      <input
        type="range"
        min={20}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #4878ef 0%, #4878ef ${((value - 20) / 80) * 100}%, #e0e0e0 ${((value - 20) / 80) * 100}%, #e0e0e0 100%)`,
        }}
      />
    </div>
  );
};

export default EraserSizeSlider;
