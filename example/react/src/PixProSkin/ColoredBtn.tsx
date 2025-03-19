import React from "react";
import SvgIcon from "./SvgIcon";
import "./_constant.less";
import "./ColoredBtn.less";

interface ColoredBtnProps {
  text: string;
  icon?: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}

const ColoredBtn: React.FC<ColoredBtnProps> = ({ text, icon = "expand-btn", disabled = false, loading = false, onClick }) => {
  return (
    <div className="colored-btn-component">
      <button onClick={onClick} disabled={disabled || loading}>
        <SvgIcon name={icon} color="#fff" />
        <span>{text}</span>
      </button>
    </div>
  );
};

export default ColoredBtn;
