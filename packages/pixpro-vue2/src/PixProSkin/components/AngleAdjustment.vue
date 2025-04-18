<template>
  <div class="rotate-ruler" @wheel="handleWheel" @mousedown="startDrag" @mousemove="handleDrag" @mouseup="stopDrag" @mouseleave="stopDrag">
    <div class="slide-container" :style="{ height: `${(maxAngle / 3) * 9}px`, ...rulerStyle }">
      <div class="ruler-content">
        <!-- 数字和刻度 -->
        <div class="ruler-scale">
          <div v-for="n in Math.floor(maxAngle / 3) + 1" :key="n" class="scale-row">
            <!-- 数字每15度(5个刻度)一个 -->
            <div class="number-cell">
              <span v-if="(n - 1) % 5 === 0">{{ (n - 1) * 3 - maxAngle / 2 }}°</span>
            </div>
            <!-- 刻度 -->
            <div class="scale-cell" :class="{ 'major-scale': (n - 1) % 5 === 0 }">
              <div class="scale-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ruler-pointer">
      <svg-icon name="pointer" />
    </div>
  </div>
</template>

<script>
import SvgIcon from "./SvgIcon.vue";
import { debounce } from "lodash-es";

export default {
  name: "AngleAdjustment",
  components: {
    SvgIcon,
  },
  props: {
    value: {
      type: Number,
      default: 0,
    },
    maxAngle: {
      type: Number,
      default: 180,
    },
    snapThreshold: {
      type: Number,
      default: 1,
    },
    snapAngles: {
      type: Array,
      default: () => [-90, -60, -45, -30, -15, 0, 15, 30, 45, 60, 90],
    },
  },
  data() {
    return {
      isDragging: false,
      startY: 0,
      startAngle: 0,
      speedFactor: 3,
      isSnapping: false,
      isScrolling: false,
      remindImage: null,
      containerCanvas: null,
    };
  },
  computed: {
    rulerStyle() {
      // 每个刻度代表3度，每个刻度高度为9px
      const pixelPerDegree = 3; // 每度对应的像素数

      // 将角度值映射到刻度尺的位置
      // 在这里，当角度为0时，我们希望0°刻度对准角标指针
      const offset = -this.value * pixelPerDegree;

      return {
        transform: `translateY(${offset}px)`,
        transition: this.isSnapping ? "transform 200ms ease-out" : "none",
      };
    },
  },
  mounted() {
    this.remindImage = document.querySelector("#remind-image");
    this.containerCanvas = document.querySelector("#container-canvas");
  },
  methods: {
    addTransition() {
      if (this.remindImage) {
        this.remindImage.style.transition = "transform 80ms ease";
      }
      if (this.containerCanvas) {
        this.containerCanvas.style.transition = "transform 80ms ease";
      }
    },
    removeTransition() {
      if (this.remindImage) {
        this.remindImage.style.transition = "";
      }
      if (this.containerCanvas) {
        this.containerCanvas.style.transition = "";
      }
    },
    hideRemindImage: debounce(function () {
      this.isScrolling = false;
      this.$emit("handle-remind-image", false);
      this.removeTransition();
    }, 500),
    checkSnap(angle) {
      // 遍历所有需要吸附的角度
      for (const snapAngle of this.snapAngles) {
        // 检查当前角度是否在吸附阈值范围内
        if (Math.abs(angle - snapAngle) <= this.snapThreshold) {
          this.isSnapping = true;
          setTimeout(() => {
            this.isSnapping = false;
          }, 200);
          return snapAngle;
        }
      }
      this.isSnapping = false;
      return angle;
    },
    handleWheel(e) {
      e.preventDefault();
      // 如果正在吸附动画中，不处理滚轮事件
      if (this.isSnapping) return;

      // 如果之前没有在滚动，则显示提醒图片并添加过渡效果
      if (!this.isScrolling) {
        this.isScrolling = true;
        this.$emit("handle-remind-image", true);
        this.addTransition();
      }

      // 重置防抖计时器
      this.hideRemindImage();

      // 根据当前角度是否在吸附范围内动态调整粒度
      let step = Math.abs(this.value) <= this.snapThreshold ? 6 : 3;
      // 应用速度因子，speedFactor越大，每次移动的角度越小
      step = step / this.speedFactor;
      const direction = e.deltaY > 0 ? 1 : -1; // 反向滚动方向
      const newValue = Math.max(-this.maxAngle / 2, Math.min(this.maxAngle / 2, this.value + direction * step));

      // 检查是否需要吸附
      const snappedValue = this.checkSnap(newValue);
      console.log(snappedValue);
      console.log(newValue, "newValue");

      if (snappedValue !== newValue) {
        this.$emit("input", snappedValue);
      } else {
        this.$emit("input", newValue);
      }
    },
    startDrag(e) {
      this.isDragging = true;
      this.startY = e.clientY;
      this.startAngle = this.value;
      this.$emit("handle-remind-image", true);
      this.addTransition();
    },
    handleDrag(e) {
      if (!this.isDragging) return;
      const deltaY = this.startY - e.clientY; // 反向拖拽方向
      // 应用速度因子，speedFactor越大，拖拽灵敏度越低
      const speedFactor = 3;
      const newAngle = this.startAngle + Math.round(deltaY / (3 * speedFactor));
      const clampedAngle = Math.max(-this.maxAngle / 2, Math.min(this.maxAngle / 2, newAngle));
      this.$emit("input", this.checkSnap(clampedAngle));
    },
    stopDrag() {
      if (this.isDragging) {
        const snappedValue = this.checkSnap(this.value);
        if (snappedValue !== this.value) {
          this.$emit("input", snappedValue);
        }
        this.$emit("handle-remind-image", false);
        this.removeTransition();
      }
      this.isDragging = false;
    },
  },
};
</script>

<style lang="less" scoped>
.rotate-ruler {
  width: 54px;
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  cursor: ns-resize;
  user-select: none;

  &:after,
  &:before {
    content: "";
    position: absolute;
    left: 0;
    width: 100%;
    height: calc(50% - 100px);
    z-index: 1;
    pointer-events: none;
  }

  &:before {
    top: 0;
    background: linear-gradient(to bottom, rgba(249, 249, 249, 1) 0%, rgba(249, 249, 249, 1) 80%, rgba(249, 249, 249, 0.8) 90%, rgba(249, 249, 249, 0) 100%);
  }

  &:after {
    bottom: 0;
    background: linear-gradient(to bottom, rgba(249, 249, 249, 0) 0%, rgba(249, 249, 249, 0.8) 10%, rgba(249, 249, 249, 1) 20%, rgba(249, 249, 249, 1) 100%);
  }

  .slide-container {
    width: 100%;
    height: 540px;
    position: relative;
    left: -12px;
    top: -4px;
  }

  .ruler-content {
    width: 100%;
    height: 100%;
  }

  .ruler-scale {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .scale-row {
      height: 9px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .number-cell {
      flex: 1;
      height: 9px;
      display: flex;
      align-items: center;
      justify-content: flex-end;

      span {
        font-size: 12px;
        width: 34px;
        text-align: right;
        padding-right: 4px;
        color: rgba(42, 50, 70, 0.7);
      }
    }

    .scale-cell {
      width: 16px;
      height: 9px;
      display: flex;
      align-items: center;
      position: relative;

      .scale-line {
        height: 2px;
        background-color: rgba(42, 50, 70, 0.2);
        position: absolute;
        right: 4px;
        width: 5px;
        border-radius: 1px;
      }

      &.major-scale {
        .scale-line {
          width: 9px;
          right: 0px;
          background-color: rgba(42, 50, 70, 0.5);
        }
      }
    }
  }

  .ruler-pointer {
    position: absolute;
    width: 14px;
    height: 14px;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    margin-right: 0;
  }
}
</style>
