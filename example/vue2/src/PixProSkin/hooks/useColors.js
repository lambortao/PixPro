// useColors.js
import { colorListData } from "./config";

export default function useColors(handleColorChange, currentColor) {
  // 定义颜色列表
  const colorList = colorListData;
  // 定义颜色选择框的可见性
  let colorBoxVisible = false;
  // 定义本地颜色列表
  let localColorList = [];

  // 计算所有颜色列表
  function getAllColorsList() {
    return [...colorList, ...localColorList];
  }

  // 从本地存储获取颜色列表
  function getColorLocalStorage() {
    const colorList = localStorage.getItem("PIXPRO_COLOR_LIST");
    if (colorList) {
      localColorList = colorList.split(",");
    }
  }

  // 设置本地存储颜色列表
  function setColorLocalStorage(colorList) {
    console.log(colorList, "colorList");
    localStorage.setItem("PIXPRO_COLOR_LIST", colorList.join(","));
  }

  // 从本地颜色列表中移除颜色
  function removeLocalColorStorage(color) {
    const index = localColorList.indexOf(color);

    if (index !== -1) {
      localColorList.splice(index, 1);
      setColorLocalStorage(localColorList);
      handleColorChange(currentColor);
      // 强制返回一个新的allColorsList对象，触发Vue的响应式更新
      colorData.allColorsList = getAllColorsList();
    }
  }

  // 处理添加新颜色
  function handleAddNewColor(color) {
    if (localColorList.includes(color)) {
      handleColorChange(color);
      colorBoxVisible = false;
      return;
    }
    localColorList.push(color);
    setColorLocalStorage(localColorList);
    handleColorChange(color);
    colorBoxVisible = false;
    // 强制返回一个新的allColorsList对象，触发Vue的响应式更新
    colorData.allColorsList = getAllColorsList();
  }

  // 初始化
  getColorLocalStorage();

  // 创建一个响应式数据对象
  const colorData = {
    colorList,
    colorBoxVisible,
    localColorList,
    allColorsList: getAllColorsList(),
    getColorLocalStorage,
    setColorLocalStorage,
    removeLocalColorStorage,
    handleAddNewColor,
  };

  return colorData;
}
