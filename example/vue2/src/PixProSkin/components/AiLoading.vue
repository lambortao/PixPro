<template>
  <div ref="containerRef" class="loader-container" :style="{ width: typeof width === 'number' ? width + 'px' : width, height: typeof height === 'number' ? height + 'px' : height }">
    <img
      class="animated-image"
      :src="imageSrc"
      :style="{
        transform: baseTransform,
        width: '2000px',
        height: '2000px',
      }"
      alt="loading"
    />
    <svg-icon class="center-loading" name="loading" :size="5" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%)" />
  </div>
</template>

<script>
import SvgIcon from "./SvgIcon.vue";

export default {
  components: {
    SvgIcon,
  },
  props: {
    width: {
      type: [Number, String],
      default: 200,
    },
    height: {
      type: [Number, String],
      default: 200,
    },
  },
  data() {
    return {
      containerSize: {
        width: 0,
        height: 0,
      },
      imageSrc: require("../assets/images/loading.png"), // 请替换为实际图片路径
      observer: null,
    };
  },
  computed: {
    baseScale() {
      const diagonal = Math.sqrt(Math.pow(this.containerSize.width, 2) + Math.pow(this.containerSize.height, 2));
      return (diagonal / 2000) * 1.1; // 增加10%安全边距
    },
    baseTransform() {
      return `translate(-50%, -50%) scale(${this.baseScale})`;
    },
  },
  methods: {
    updateContainerSize() {
      if (this.$refs.containerRef) {
        this.containerSize = {
          width: this.$refs.containerRef.clientWidth,
          height: this.$refs.containerRef.clientHeight,
        };
      }
    },
    injectKeyframes() {
      const keyframes = Array.from({ length: 20 }, (_, i) => {
        const progress = i / 19; // 0到1
        const angle = progress * 2160; // 旋转四周（1440度）
        const scale = 0.8 + Math.abs(Math.sin(progress * Math.PI * 4)) * 0.8; // 波动缩放
        const translateX = Math.sin(progress * Math.PI * 6) * 2; // X轴位移
        const translateY = Math.cos(progress * Math.PI * 3) * 3; // Y轴位移

        return `
          ${((i / 19) * 100).toFixed(2)}% {
            transform: translate(-50%, -50%) 
              scale(${this.baseScale * scale}) 
              rotate(${angle}deg)
              translate(${translateX}%, ${translateY}%);
          }`;
      }).join("");

      const style = document.createElement("style");
      style.textContent = `
        @keyframes complexAnimation {
          ${keyframes}
        }
        .animated-image {
          animation: complexAnimation 12s infinite linear;
          transform-origin: center center;
          will-change: transform;
        }
      `;
      document.head.appendChild(style);
    },
  },
  mounted() {
    // 获取初始尺寸
    this.updateContainerSize();

    // 监听尺寸变化
    this.observer = new ResizeObserver(this.updateContainerSize);
    if (this.$refs.containerRef) {
      this.observer.observe(this.$refs.containerRef);
    }

    // 动态注入关键帧
    this.injectKeyframes();
  },
  beforeDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
};
</script>

<style scoped>
.loader-container {
  position: relative;
  overflow: hidden;
  background-color: transparent;
  position: relative;
}

.animated-image {
  position: absolute;
  top: 50%;
  left: 50%;
  animation: complexAnimation 12s infinite linear;
  transform-origin: center center;
  min-width: 2000px;
  min-height: 2000px;
  will-change: transform; /* 优化动画性能 */
}
</style>
