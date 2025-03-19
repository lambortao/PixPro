<template>
  <div 
    class="rotate-ruler"
    @wheel="handleWheel"
    @mousedown="startDrag"
    @mousemove="handleDrag"
    @mouseup="stopDrag"
    @mouseleave="stopDrag"
  >
    <div
      class="slide-container"
      :style="{ height: `${(maxAngle / 3) * 9}px`, ...rulerStyle }"
    >
      <div class="angle-number-box">
        <span v-for="n in ((maxAngle / 15) + 1)" :key="n">{{ (maxAngle / 2) - (n - 1) * 15 }}°</span>
      </div>
      <div class="angle-scale-box">
        <span v-for="n in (maxAngle / 3)" :key="n" class="angle-scale-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="6" height="2" viewBox="0 0 6 2"><path class="PAH8vy" fill-rule="nonzero" d="M0 1.478V.48h6v.998z"></path></svg>
        </span>
      </div>
    </div>
    <div class="ruler"><svg-icon name="pointer" /></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import SvgIcon from './SvgIcon.vue';

const model = defineModel<number>({ default: 0 });

const props = defineProps<{
  maxAngle: number;
}>();

const maxAngle = ref(props.maxAngle);

// 是否正在拖动
const isDragging = ref(false);
// 拖动开始时的 Y 坐标
const startY = ref(0);
// 拖动开始时的角度
const startAngle = ref(0);

// 计算标尺容器的位移
const rulerStyle = computed(() => ({
  transform: `translateY(${model.value * 2.95}px)`
}));

// 判断刻度是否激活
const isActiveTick = (degree: number) => {
  return 90 - degree === model.value;
};

// 获取刻度的样式
const getTickStyle = (index: number) => {
  const degree = 90 - index;
  return {
    transform: `translateY(${-index * 1.5}px)`,
    opacity: Math.abs(degree - model.value) > 45 ? 0.3 : 1
  };
};

// 处理滚轮事件
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  const direction = e.deltaY > 0 ? -1 : 1;
  const newValue = Math.max(-maxAngle.value/2, Math.min(maxAngle.value/2, model.value + direction * 5));
  model.value = newValue;
};

// 开始拖动
const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  startY.value = e.clientY;
  startAngle.value = model.value;
};

// 处理拖动
const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaY = e.clientY - startY.value;
  const newAngle = startAngle.value + Math.round(deltaY / 1.5);
  model.value = Math.max(-maxAngle.value/2, Math.min(maxAngle.value/2, newAngle));
};

// 停止拖动
const stopDrag = () => {
  isDragging.value = false;
};
</script>

<style lang="less" scoped>
.rotate-ruler {
  width: 54px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  overflow: hidden;
  cursor: ns-resize;
  user-select: none;
  position: relative;
  &:after, &:before {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: 100px;
    z-index: 1;
  }
  &:before {
    top: 0;
    background: linear-gradient(to top, rgba(249, 249, 249, 0), rgba(249, 249, 249, 1));
  }
  &:after {
    bottom: 0;
    background: linear-gradient(to bottom, rgba(249, 249, 249, 0), rgba(249, 249, 249, 1));
  }

  .slide-container {
    width: 100%;
    height: 540px;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .angle-number-box {
    flex: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: space-between;

    span {
      display: block;
      line-height: 20px;
      width: 30px;
      height: 20px;
      text-align: right;
      font-size: 12px;
    }
  }

  .angle-scale-box {
    width: 8px;
    height: 100%;

    .angle-scale-item {
      width: 8px;
      height: 9px;
      display: flex;
      opacity: 0.3;
      align-items: center;
      justify-content: center;
    }
  }

  .ruler {
    width: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>