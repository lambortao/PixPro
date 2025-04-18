// useColors.js
const colorListData = ["transparent", "#ffffff", "#e3e9ef", "#dbe9fd", "#afc5c1", "#a2e1c9", "#4067c5", "#0b209f", "#4041c3", "#27297e", "#5a335f", "#d74f3c", "#ebaacb", "#fbe8e3", "#f3e48b", "#ccef7a", "#75c097", "#62b6b0", "#6de9b0", "#83c8df"];

export default class useColors {
  constructor(handleColorChange, currentColor) {
    this.handleColorChange = handleColorChange;
    this.currentColor = currentColor;
    this.colorList = [...colorListData];
    this.colorBoxVisible = false;
    this.localColorList = [];

    this.getColorLocalStorage();
  }

  get allColorsList() {
    return [...this.colorList, ...this.localColorList];
  }

  getColorLocalStorage() {
    const storedColors = localStorage.getItem("PIXPRO_COLOR_LIST");
    if (storedColors) {
      this.localColorList = storedColors.split(",");
    }
  }

  setColorLocalStorage(colors) {
    localStorage.setItem("PIXPRO_COLOR_LIST", colors.join(","));
  }

  removeLocalColorStorage(color) {
    const index = this.localColorList.indexOf(color);
    if (index !== -1) {
      this.localColorList.splice(index, 1);
      this.setColorLocalStorage(this.localColorList);
      setTimeout(() => {
        this.handleColorChange(this.currentColor);
      }, 0);
    }
  }

  handleAddNewColor(color) {
    if (this.localColorList.includes(color)) {
      this.handleColorChange(color);
      this.colorBoxVisible = false;
      return;
    }
    this.localColorList.push(color);
    this.setColorLocalStorage(this.localColorList);
    this.handleColorChange(color);
    this.colorBoxVisible = false;
  }

  // Additional getters if you want to expose private-like properties
  getColorBoxVisible() {
    return this.colorBoxVisible;
  }

  getLocalColorList() {
    return [...this.localColorList];
  }
}
