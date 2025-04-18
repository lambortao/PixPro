import React, { useRef } from "react";
import SvgIcon from "./SvgIcon";
import "./AddNewColor.less";

interface AddNewColorProps {
  value: boolean;
  onChange: (color: string) => void;
  onOpen: () => void;
  onRemove?: (color: string) => void;
  localColorList?: string[];
  currentColor?: string;
}

const AddNewColor: React.FC<AddNewColorProps> = ({ value, onChange, onOpen }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    onOpen();
  };

  const handleConfirm = () => {
    const color = inputRef.current?.value;
    if (color) {
      onChange(color);
    }
  };

  const handleCancel = () => {
    onChange("");
  };

  return (
    <div className="AddNewColor-item add-btn">
      <span onClick={handleClick}>
        <SvgIcon name="add" />
      </span>
      {value && (
        <div className="color-select">
          <p>点击色块选择颜色</p>
          <input type="color" ref={inputRef} />
          <footer>
            <button onClick={handleConfirm} className="toolbar-btn primary">
              确认
            </button>
            <button onClick={handleCancel} className="toolbar-btn">
              取消
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default AddNewColor;
