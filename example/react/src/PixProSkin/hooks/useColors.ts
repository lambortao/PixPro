import { useState, useMemo, useEffect } from "react";

const colorListData = ["transparent", "#ffffff", "#e3e9ef", "#dbe9fd", "#afc5c1", "#a2e1c9", "#4067c5", "#0b209f", "#4041c3", "#27297e", "#5a335f", "#d74f3c", "#ebaacb", "#fbe8e3", "#f3e48b", "#ccef7a", "#75c097", "#62b6b0", "#6de9b0", "#83c8df"];

interface UseColorsReturn {
  colorBoxVisible: boolean;
  setColorBoxVisible: (visible: boolean) => void;
  localColorList: string[];
  allColorsList: string[];
  removeLocalColorStorage: (color: string) => void;
  handleAddNewColor: (color: string) => void;
  openColorBox: () => void;
}

const useColors = (handleColorChange: (color: string) => void, currentColor: string): UseColorsReturn => {
  const [colorBoxVisible, setColorBoxVisible] = useState(false);
  const [localColorList, setLocalColorList] = useState<string[]>([]);

  const allColorsList = useMemo(() => {
    return [...colorListData, ...localColorList];
  }, [localColorList]);

  const getColorLocalStorage = () => {
    const colorList = localStorage.getItem("PIXPRO_COLOR_LIST");
    if (colorList) {
      setLocalColorList(colorList.split(","));
    }
  };

  const setColorLocalStorage = (colorList: string[]) => {
    localStorage.setItem("PIXPRO_COLOR_LIST", colorList.join(","));
  };

  const removeLocalColorStorage = (color: string) => {
    const index = localColorList.indexOf(color);
    if (index !== -1) {
      const newColorList = [...localColorList];
      newColorList.splice(index, 1);
      setLocalColorList(newColorList);
      setColorLocalStorage(newColorList);
      setTimeout(() => {
        handleColorChange(currentColor);
      });
    }
  };

  const handleAddNewColor = (color: string) => {
    if (!color) {
      setColorBoxVisible(false);
      return;
    }
    console.log(localColorList, "localColorList");
    console.log(color, "color");

    if (localColorList.includes(color) || colorListData.includes(color)) {
      handleColorChange(color);
      setColorBoxVisible(false);
      return;
    }
    const newColorList = [...localColorList, color];
    setLocalColorList(newColorList);
    setColorLocalStorage(newColorList);
    handleColorChange(color);
    setColorBoxVisible(false);
  };

  const openColorBox = () => {
    setColorBoxVisible(true);
  };

  useEffect(() => {
    getColorLocalStorage();
  }, []);

  return {
    openColorBox,
    colorBoxVisible,
    setColorBoxVisible,
    localColorList,
    allColorsList,
    removeLocalColorStorage,
    handleAddNewColor,
  };
};

export default useColors;
