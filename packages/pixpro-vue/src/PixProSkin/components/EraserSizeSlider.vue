<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  min: number
  max: number
}>()

const size = defineModel<number>('size', {
  type: Number,
  required: true,
  default: 50,
  set: (newVal: number | string) => {
    return parseInt(newVal as string)
  }
})

const cursorCircle = ref<HTMLDivElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const isHovering = ref(false)

const updateCirclePosition = () => {
  if (!inputRef.value || !cursorCircle.value) return
  
  const input = inputRef.value
  const rect = input.getBoundingClientRect()
  const thumbWidth = 16 // 滑块按钮的宽度
  const range = props.max - props.min // 滑块的范围
  const percentage = (size.value - props.min) / range // 当前值在范围内的百分比
  
  // 计算滑块按钮的位置
  const thumbPosition = rect.left + (rect.width - thumbWidth) * percentage + thumbWidth / 2
  
  cursorCircle.value.style.left = `${thumbPosition}px`
  cursorCircle.value.style.top = `${rect.top + rect.height / 2}px`
}

// 监听 size 变化和窗口大小变化
watch(size, updateCirclePosition)
onMounted(() => {
  window.addEventListener('resize', updateCirclePosition)
  // 初始化圆形指示器位置
  setTimeout(updateCirclePosition, 0)
})
onUnmounted(() => {
  window.removeEventListener('resize', updateCirclePosition)
})
</script>

<template>
  <div style="padding-bottom: 20px">
    <small>橡皮擦大小</small>
    <input
      ref="inputRef"
      type="range"
      :min="min"
      :max="max"
      v-model="size"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
      :style="{ 
        background: `linear-gradient(to right, #4878ef 0%, #4878ef ${(size - min) / (max - min) * 100}%, #e0e0e0 ${(size - min) / (max - min) * 100}%, #e0e0e0 100%)`
      }"
    />
    <div
      v-show="isHovering"
      ref="cursorCircle"
      :style="{
        position: 'fixed',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#4878ef',
        opacity: 0.3,
        pointerEvents: 'none',
        zIndex: 12,
        transform: 'translate(-50%, -50%)'
      }"
    />
  </div>
</template>

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
  transition: opacity .2s;
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