<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <div class="flex gap-6">
      <div class="flex-1">
        <div class="space-y-4 mb-4 relative z-10">
          <div>
            <label class="block text-sm font-medium mb-2">旋转角度：{{ angle }}°</label>
            <input
              type="range"
              min="0"
              max="360"
              v-model="angle"
              class="w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-2">
              图片尺寸：{{ imageSize.width }} x {{ imageSize.height }}
            </label>
            <div class="flex gap-2">
              <button
                @click="setImageSize({ width: 200, height: 120 })"
                class="px-3 py-1 bg-gray-200 rounded text-sm"
              >
                与裁切框相同
              </button>
              <button
                @click="setImageSize({ width: 400, height: 240 })"
                class="px-3 py-1 bg-gray-200 rounded text-sm"
              >
                2倍大小
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">图片位置调整</label>
            <div class="flex gap-4">
              <div>
                <label class="block text-xs mb-1">X 偏移: {{ imagePosition.x }}px</label>
                <input
                  type="range"
                  :min="0"
                  :max="imageSize.width - cropBoxWidth"
                  v-model="imagePosition.x"
                  class="w-full"
                />
              </div>
              <div>
                <label class="block text-xs mb-1">Y 偏移: {{ imagePosition.y }}px</label>
                <input
                  type="range"
                  :min="0"
                  :max="imageSize.height - cropBoxHeight"
                  v-model="imagePosition.y"
                  class="w-full"
                />
              </div>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <input
              type="checkbox"
              id="debug"
              v-model="debug"
            />
            <label for="debug" class="text-sm">显示辅助线</label>
          </div>
        </div>
        
        <div class="relative bg-gray-100 w-[600px] h-[600px] border border-gray-300">
          <!-- 裁切框 - 固定大小 -->
          <div 
            class="absolute border-2 border-blue-500"
            :style="{
              width: `${cropBoxWidth}px`,
              height: `${cropBoxHeight}px`,
              left: `${imagePosition.x}px`,
              top: `${imagePosition.y}px`
            }"
          />
          
          <!-- 旋转的图片 -->
          <div 
            class="absolute bg-gray-400/20 border border-red-500 transition-all duration-300"
            :style="{
              width: `${imageSize.width}px`,
              height: `${imageSize.height}px`,
              left: '0px',
              top: '0px',
              transformOrigin: `${cropBoxWidth/2 + imagePosition.x}px ${cropBoxHeight/2 + imagePosition.y}px`,
              transform: `rotate(${angle}deg) scale(${scale})`
            }"
          >
            <img
              src="/api/placeholder/800/480"
              alt="Demo"
              class="w-full h-full object-cover opacity-50"
            />
          </div>

          <div
            v-if="debug"
            class="absolute border border-green-500 rounded-full"
            :style="{
              width: `${diagonal}px`,
              height: `${diagonal}px`,
              left: `${imagePosition.x + cropBoxWidth/2 - diagonal/2}px`,
              top: `${imagePosition.y + cropBoxHeight/2 - diagonal/2}px`
            }"
          />
        </div>
      </div>

      <div class="flex-1 space-y-4 relative z-10">
        <div v-if="showCalculation" class="prose">
          <h3>安全距离计算：</h3>
          <ul class="list-disc list-inside">
            <li>X轴安全距离: {{ safeDistanceX.toFixed(1) }}px</li>
            <li>Y轴安全距离: {{ safeDistanceY.toFixed(1) }}px</li>
            <li>当前是否在安全区域: {{ isInSafeArea(imageSize.width, imageSize.height, imagePosition.x, imagePosition.y) ? '是' : '否' }}</li>
            <li>当前缩放比例: {{ scale.toFixed(4) }}</li>
          </ul>
        </div>
        <button
          @click="showCalculation = !showCalculation"
          class="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {{ showCalculation ? '隐藏计算过程' : '显示计算过程' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 响应式状态
const angle = ref(0)
const showCalculation = ref(false)
const imageSize = ref({ width: 400, height: 240 })
const imagePosition = ref({ x: 0, y: 0 })
const debug = ref(false)

// 常量
const cropBoxWidth = 200
const cropBoxHeight = 120

// 计算属性
const diagonal = computed(() => 
  Math.sqrt(Math.pow(cropBoxWidth, 2) + Math.pow(cropBoxHeight, 2))
)

const safeDistanceX = computed(() => 
  (diagonal.value - cropBoxWidth) / 2
)

const safeDistanceY = computed(() => 
  (diagonal.value - cropBoxHeight) / 2
)

// 方法
const isInSafeArea = (width, height, x, y) => {
  // 上边界检查
  if (y < safeDistanceY.value) return false
  
  // 左边界检查
  if (x < safeDistanceX.value) return false
  
  // 下边界检查
  if (height < (cropBoxHeight + y + safeDistanceY.value)) return false
  
  // 右边界检查
  if (width < (cropBoxWidth + x + safeDistanceX.value)) return false
  
  return true
}

const calculateRotationScale = (width, height, angle) => {
  const radian = (angle * Math.PI) / 180
  const cos = Math.abs(Math.cos(radian))
  const sin = Math.abs(Math.sin(radian))
  
  const rotatedWidth = width * cos + height * sin
  const rotatedHeight = height * cos + width * sin
  
  const scaleX = rotatedWidth / width
  const scaleY = rotatedHeight / height
  
  return Math.max(scaleX, scaleY)
}

const scale = computed(() => {
  // 如果在安全区域内，不需要缩放
  if (isInSafeArea(
    imageSize.value.width,
    imageSize.value.height,
    imagePosition.value.x,
    imagePosition.value.y
  )) {
    return 1
  }
  
  // 不在安全区域，使用标准旋转缩放
  return calculateRotationScale(cropBoxWidth, cropBoxHeight, angle.value)
})

// 方法
const setImageSize = (size) => {
  imageSize.value = size
}
</script>