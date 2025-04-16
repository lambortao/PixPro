<template>
    <div 
    ref="containerRef"
    class="loader-container"
    :style="{ width: typeof width === 'number' ? width + 'px' : width, 
             height: typeof height === 'number' ? height + 'px' : height }"
  >
    <img
      class="animated-image"
      :src="imageSrc"
      :style="{ 
        transform: baseTransform,
        width: '2000px',
        height: '2000px'
      }"
      alt="loading"
    />
    <svg-icon 
      class="center-loading" 
      name="loading" 
      :size="5" 
      style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"
    />
  </div>
</template>

<script setup>
import SvgIcon from './SvgIcon.vue';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import imageSrc from '../assets/images/loading.png' // 请替换为实际图片路径


const props = defineProps({
  width: { type: [Number, String], default: 200 },
  height: { type: [Number, String], default: 200 }
})

const containerRef = ref(null)
const containerSize = ref({ width: 0, height: 0 })

// 计算基础缩放比例
const baseScale = computed(() => {
  const diagonal = Math.sqrt(
    Math.pow(containerSize.value.width, 2) + 
    Math.pow(containerSize.value.height, 2)
  )
  return diagonal / 2000 * 1.2 // 增加10%安全边距
})

// 基础变换矩阵
const baseTransform = computed(() => 
  `translate(-50%, -50%) scale(${baseScale.value})`
)

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
})

function updateContainerSize() {
  if (containerRef.value) {
    containerSize.value = {
      width: containerRef.value.clientWidth,
      height: containerRef.value.clientHeight
    }
  }
}

let observer;

// 动态注入关键帧
onMounted(() => {
  // 获取初始尺寸
  updateContainerSize()

    // 监听尺寸变化
  observer = new ResizeObserver(updateContainerSize)
  if (containerRef.value) {
    observer.observe(containerRef.value)
  }

  const keyframes = Array.from({length: 20}, (_, i) => {
    const progress = i / 19; // 0到1
    const angle = progress * 2160; // 旋转四周（1440度）
    const scale = 0.8 + Math.abs(Math.sin(progress * Math.PI * 4)) * 0.8; // 波动缩放
    const translateX = Math.sin(progress * Math.PI * 6) * 2; // X轴位移
    const translateY = Math.cos(progress * Math.PI * 3) * 3; // Y轴位移
    
    return `
      ${(i / 19 * 100).toFixed(2)}% {
        transform: translate(-50%, -50%) 
          scale(${baseScale.value * scale}) 
          rotate(${angle}deg)
          translate(${translateX}%, ${translateY}%);
      }`;
  }).join('');

  const style = document.createElement('style');
  style.textContent = `
    @keyframes complexAnimation {
      ${keyframes}
    }`;
  document.head.appendChild(style);
});
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