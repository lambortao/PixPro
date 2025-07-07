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
      <div class="ruler-content">
        <!-- 数字和刻度 -->
        <div class="ruler-scale">
          <div v-for="n in (maxAngle / 3 + 1)" :key="n" class="scale-row">
            <!-- 数字每15度(5个刻度)一个 -->
            <div class="number-cell">
              <span v-if="(n - 1) % 5 === 0">{{ (n - 1) * 3 - (maxAngle / 2) }}°</span>
            </div>
            <!-- 刻度 -->
            <div class="scale-cell" :class="{ 'major-scale': (n - 1) % 5 === 0 }">
              <div class="scale-line"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="ruler-pointer"><svg-icon name="pointer" /></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import SvgIcon from './SvgIcon.vue';
import { debounce } from 'lodash-es';

const model = defineModel<number>({ default: 0 });
const props = defineProps<{
  maxAngle: number;
  snapThreshold?: number;
  snapAngles?: number[]
}>();

const maxAngle = ref(props.maxAngle);
const snapThreshold = ref(props.snapThreshold ?? 1);
/** 速度因子，值越大移动越慢 */
const speedFactor = ref(2);
/** 需要吸附的角度数组，默认只有0度 */
const snapAngles = ref([-90, -60, -45, -30, -15 , 0, 15, 30, 45, 60, 90]);
const isSnapping = ref(false);
const isScrolling = ref(false);

const emits = defineEmits<{
  (e: 'handle-remind-image', visible: boolean): void
}>()

// 是否正在拖动
const isDragging = ref(false);
// 拖动开始时的 Y 坐标
const startY = ref(0);
// 拖动开始时的角度
const startAngle = ref(0);

// 添加DOM元素引用
const remindImage = ref<HTMLElement | null>(null);
const containerCanvas = ref<HTMLElement | null>(null);

// 在组件挂载后获取DOM元素
onMounted(() => {
  remindImage.value = document.querySelector('#remind-image');
  containerCanvas.value = document.querySelector('#container-canvas');
});

// 添加和移除过渡效果的函数
const addTransition = () => {
  if (remindImage.value) {
    remindImage.value.style.transition = 'transform 80ms ease';
  }
  if (containerCanvas.value) {
    containerCanvas.value.style.transition = 'transform 80ms ease';
  }
};

const removeTransition = () => {
  if (remindImage.value) {
    remindImage.value.style.transition = '';
  }
  if (containerCanvas.value) {
    containerCanvas.value.style.transition = '';
  }
};

// 创建防抖函数，延迟300ms后隐藏提醒图片
const hideRemindImage = debounce(() => {
  isScrolling.value = false;
  emits('handle-remind-image', false);
  removeTransition();
}, 500);

// 计算标尺容器的位移
const rulerStyle = computed(() => {
  // 每个刻度代表3度，每个刻度高度为9px
  const pixelPerDegree = 3; // 每度对应的像素数
  
  // 将角度值映射到刻度尺的位置
  // 在这里，当角度为0时，我们希望0°刻度对准角标指针
  const offset = -model.value * pixelPerDegree;
  
  return {
    transform: `translateY(${offset}px)`,
    transition: isSnapping.value ? 'transform 200ms ease-out' : 'none'
  };
});

// 添加吸附检查函数
const checkSnap = (angle: number): number => {
  // 遍历所有需要吸附的角度
  for (const snapAngle of snapAngles.value) {
    // 检查当前角度是否在吸附阈值范围内
    if (Math.abs(angle - snapAngle) <= snapThreshold.value) {
      isSnapping.value = true;
      setTimeout(() => {
        isSnapping.value = false;
      }, 200);
      return snapAngle;
    }
  }
  isSnapping.value = false;
  return angle;
};

// 处理滚轮事件
const handleWheel = (e: WheelEvent) => {
  e.preventDefault();
  
  // 如果正在吸附动画中，不处理滚轮事件
  if (isSnapping.value) return;
  
  // 如果之前没有在滚动，则显示提醒图片并添加过渡效果
  if (!isScrolling.value) {
    isScrolling.value = true;
    emits('handle-remind-image', true);
    addTransition();
  }
  
  // 重置防抖计时器
  hideRemindImage();
  
  // 根据当前角度是否在吸附范围内动态调整粒度
  let step = Math.abs(model.value) <= snapThreshold.value ? 6 : 3;
  // 应用速度因子，speedFactor越大，每次移动的角度越小
  step = step / speedFactor.value;
  const direction = e.deltaY > 0 ? 1 : -1; // 反向滚动方向
  const newValue = Math.max(-maxAngle.value/2, Math.min(maxAngle.value/2, model.value + direction * step));
  
  // 检查是否需要吸附
  const snappedValue = checkSnap(newValue);
  if (snappedValue !== newValue) {
    model.value = snappedValue;
  } else {
    model.value = newValue;
  }
};

// 开始拖动
const startDrag = (e: MouseEvent) => {
  isDragging.value = true;
  startY.value = e.clientY;
  startAngle.value = model.value;
  emits('handle-remind-image', true);
  addTransition();
};

// 处理拖动
const handleDrag = (e: MouseEvent) => {
  if (!isDragging.value) return;
  const deltaY = startY.value - e.clientY; // 反向拖拽方向
  // 应用速度因子，speedFactor越大，拖拽灵敏度越低
  const newAngle = startAngle.value + Math.round(deltaY / (3 * speedFactor.value));
  model.value = checkSnap(Math.max(-maxAngle.value/2, Math.min(maxAngle.value/2, newAngle)));
};

// 停止拖动时也检查是否需要吸附
const stopDrag = () => {
  if (isDragging.value) {
    const snappedValue = checkSnap(model.value);
    if (snappedValue !== model.value) {
      model.value = snappedValue;
    }
    emits('handle-remind-image', false);
    removeTransition();
  }
  isDragging.value = false;
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
  
  &:after, &:before {
    content: '';
    position: absolute;
    left: 0;
    width: 100%;
    height: calc(50% - 100px);
    z-index: 1;
    pointer-events: none;
  }
  
  &:before {
    top: 0;
    background: linear-gradient(to bottom, 
      rgba(249, 249, 249, 1) 0%,
      rgba(249, 249, 249, 1) 80%, 
      rgba(249, 249, 249, 0.8) 90%,
      rgba(249, 249, 249, 0) 100%
    );
  }
  
  &:after {
    bottom: 0;
    background: linear-gradient(to bottom, 
      rgba(249, 249, 249, 0) 0%,
      rgba(249, 249, 249, 0.8) 10%,
      rgba(249, 249, 249, 1) 20%,
      rgba(249, 249, 249, 1) 100%
    );
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