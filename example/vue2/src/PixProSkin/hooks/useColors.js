// hooks/useColors.js
import { colorListData } from './config.js';

export default {
  data() {
    return {
      colorList: colorListData,
      colorBoxVisible: false,
      localColorList: []
    };
  },
  computed: {
    allColorsList() {
      return [...this.colorList, ...this.localColorList];
    }
  },
  methods: {
    getColorLocalStorage() {
      const colorList = localStorage.getItem('PIXPRO_COLOR_LIST');
      if (colorList) {
        this.localColorList = colorList.split(',');
      }
    },
    setColorLocalStorage(colorList) {
      localStorage.setItem('PIXPRO_COLOR_LIST', colorList.join(','));
    },
    removeLocalColorStorage(color) {
      const index = this.localColorList.indexOf(color);
      if (index !== -1) {
        this.localColorList.splice(index, 1);
        this.setColorLocalStorage(this.localColorList);
        this.$nextTick(() => {
          this.handleColorChange(this.currentColor);
        });
      }
    },
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
  },
  mounted() {
    this.getColorLocalStorage();
  }
};