<template>
  <div style="padding-bottom: 20px">
    <small>橡皮擦大小</small>
    <input
      ref="inputRef"
      type="range"
      :min="min"
      :max="max"
      v-model="eraserSize"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
      :style="{
        background: `linear-gradient(to right, #4878ef 0%, #4878ef ${((eraserSize - min) / (max - min)) * 100}%, #e0e0e0 ${((eraserSize - min) / (max - min)) * 100}%, #e0e0e0 100%)`,
      }"
    />
    <div
      v-show="isHovering"
      ref="cursorCircle"
      :style="{
        position: 'fixed',
        width: `${eraserSize}px`,
        height: `${eraserSize}px`,
        borderRadius: '50%',
        backgroundColor: '#4878ef',
        opacity: 0.3,
        pointerEvents: 'none',
        zIndex: 12,
        transform: 'translate(-50%, -50%)',
      }"
    />
  </div>
</template>

<script>
export default {
  name: "EraserSizeSlider",
  props: {
    value: {
      type: Number,
      required: true,
      default: 50,
    },
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      eraserSize: this.value,
      isHovering: false,
      cursorCircle: null,
      inputRef: null,
    };
  },
  watch: {
    value(newVal) {
      this.eraserSize = newVal;
    },
    eraserSize(newVal) {
      this.$emit("input", newVal);
      this.updateCirclePosition();
    },
  },
  mounted() {
    this.cursorCircle = this.$refs.cursorCircle;
    this.inputRef = this.$refs.inputRef;
    window.addEventListener("resize", this.updateCirclePosition);
    setTimeout(this.updateCirclePosition, 0);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.updateCirclePosition);
  },
  methods: {
    updateCirclePosition() {
      if (!this.inputRef || !this.cursorCircle) return;

      const input = this.inputRef;
      const rect = input.getBoundingClientRect();
      const thumbWidth = 16; // 滑块按钮的宽度
      const range = this.max - this.min; // 滑块的范围
      const percentage = (this.eraserSize - this.min) / range; // 当前值在范围内的百分比

      // 计算滑块按钮的位置
      const thumbPosition = rect.left + (rect.width - thumbWidth) * percentage + thumbWidth / 2;

      this.cursorCircle.style.left = `${thumbPosition}px`;
      this.cursorCircle.style.top = `${rect.top + rect.height / 2}px`;
    },
  },
};
</script>

<style scoped>
small {
  display: block;
  margin: 20px 0 10px;
}

input {
  width: 100%;
  -webkit-appearance: none; /* Safari */
  appearance: none;
  height: 6px;
  border-radius: 3px;
  outline: none;
  opacity: 1;
  transition: opacity 0.2s;
}

input::-webkit-slider-thumb {
  -webkit-appearance: none; /* Safari */
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4878ef;
  cursor: pointer;
}

input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4878ef;
  cursor: pointer;
}
</style>
