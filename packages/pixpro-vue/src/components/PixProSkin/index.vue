<template>
  <main class="editor-main">
    <div class="pix-pro-container">
      <button title="关闭" class="close-btn close" @click="handleClose">
        <svg-icon name="close" />
      </button>

      <!-- 侧边栏 -->
      <nav>
        <menu :class="{ disabled: !controlsShow || controlLoading }">
          <div v-for="(value, key) in controlText" :key="key" @click="switchTab(key)"
            :class="{ active: activeTab === key }">
            <svg-icon :name="value.icon" />
            <span>{{ value.btn }}</span>
          </div>
        </menu>
        <figure class="logo">
          <svg-icon name="logo" />
        </figure>
      </nav>

      <!-- 操作区 -->
      <div v-if="controlsShow" class="controls-container">
        <div class="control-header">
          <h3>{{ controlText[activeTab as keyof typeof controlText].title }}</h3>
          <small v-if="controlText[activeTab as keyof typeof controlText].desc">{{ controlText[activeTab as keyof typeof controlText].desc }}</small>
        </div>
        <div class="control-content">
          <div class="crop" v-if="activeTab === 'crop' || activeTab === 'expand'">
            <div class="section" v-if="showCropRatios">
              <div
                v-for="(item, key) in cropRatios"
                class="icon-btn"
                :key="key"
                :class="{ active: key === cropRationLabel, disabled: controlLoading }"
                @click="handleCropRatio(item, key)"
              >
                <template v-if="key === 'original'">
                  <svg-icon name="original" />
                  <span>原比例</span>
                </template>
                <template v-else>
                  <figure><i :style="getRatioStyle(item)"></i></figure>
                  <span>{{ key }}</span>
                </template>
              </div>
            </div>
            <div class="section" :style="{ marginTop: showCropRatios ? '0' : '10px' }">
              <div class="size-inputs">
                <div class="input-group">
                  <label>宽度 (像素)</label>
                  <input
                    type="number"
                    v-model="nowWidth"
                    :disabled="true"
                    @blur="() => handleSizeChange('width')"
                    @keyup.enter="() => handleSizeChange('width')"
                  />
                </div>
                <div class="input-group">
                  <label>高度 (像素)</label>
                  <input
                    type="number"
                    v-model="nowHeight"
                    :disabled="true"
                    @blur="() => handleSizeChange('height')"
                    @keyup.enter="() => handleSizeChange('height')"
                  />
                </div>
              </div>
            </div>
            <div v-if="activeTab === 'crop'" class="section flip-btn">
              <button @click="handleTurn('left')" title="左翻转" :disabled="controlLoading"><svg-icon name="flip-l" /></button>
              <button @click="handleTurn('right')" title="右翻转" :disabled="controlLoading"><svg-icon name="flip-r" /></button>
              <button @click="handleFlip('y')" title="上下翻转" :disabled="controlLoading"><svg-icon name="flip-x" /></button>
              <button @click="handleFlip('x')" title="左右翻转" :disabled="controlLoading"><svg-icon name="flip-y" /></button>
            </div>
            <div v-if="activeTab === 'expand'" class="section">
              <colored-btn
                @click="handleExpandImage"
                :loading="aiLoading"
                text="扩展图片"
                :disabled="expandImageBtnStatus || controlLoading || !allowExpand"
              />
              <small v-if="!allowExpand">原图图片分辨率需大于 {{ MIN_EXPAND_IMAGE_WIDTH }} x {{ MIN_EXPAND_IMAGE_HEIGHT }} 且小于 {{ MAX_EXPAND_IMAGE_WIDTH }} x {{ MAX_EXPAND_IMAGE_HEIGHT }} 才能扩图。</small>
            </div>
          </div>
          <div class="erase" v-if="activeTab === 'erase'">
            <div class="section">
              <EraserSizeSlider v-model:size="eraserSize" />
              <colored-btn
                text="清除物件"
                :loading="aiLoading"
                :disabled="!eraseImageBtnDisabled || !allowErase"
                @click="handleErase"
              />
              <small v-if="!allowErase">图片分辨率需大于 {{ MIN_ERASE_IMAGE_WIDTH }} x {{ MIN_ERASE_IMAGE_HEIGHT }} 且小于 {{ MAX_ERASE_IMAGE_WIDTH }} x {{ MAX_ERASE_IMAGE_HEIGHT }} 才能擦除。</small>
            </div>
          </div>
          <div v-if="activeTab === 'remove-bg'" class="remove-bg">
            <div class="section">
              <colored-btn
                @click="handleRemoveBg"
                :loading="aiLoading"
                :disabled="!allowRemoveBg"
                text="一键移除"
              />
              <small v-if="!allowRemoveBg">宽低于 {{ MIN_REMOVE_BG_WIDTH }}px 或高低于 {{ MIN_REMOVE_BG_HEIGHT }}px，无法一键移除背景。</small>
              <span class="line"></span>
              <div class="color-list">
                <small>背景颜色</small>
                <div class="color-box">
                  <div
                    v-for="item in colorList"
                    :class="[{ 'color-item': true, active: item === currentColor }, { 'transparent': item === 'transparent' }]"
                    :key="item"
                    @click="handleColorChange(item)"
                  ><span :style="{ backgroundColor: item }"></span></div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeTab === 'hd'" class="hd">
            <div class="section">
              <colored-btn @click="handleHd" :loading="aiLoading" text="一键提升" :disabled="!allowHd" />
              <small v-if="!allowHd">图片分辨率需大于 {{ MIN_HD_IMAGE_WIDTH }} x {{ MIN_HD_IMAGE_HEIGHT }} 且小于 {{ MAX_HD_IMAGE_WIDTH }} x {{ MAX_HD_IMAGE_HEIGHT }} 才能提升解析度。</small>
            </div>
          </div>
          <div v-if="activeTab === 'compress'" class="compress">
            <div class="section">
              <colored-btn text="一键压缩" :loading="aiLoading" />
            </div>
          </div>
        </div>
      </div>
      <!-- 图片区 -->
      <div class="image-container">
        <header class="image-toolbar">
          <div class="toolbar-status">
            <span v-if="nowWidth || nowHeight">目标图片分辨率：{{ nowWidth }} x {{ nowHeight }}</span>
          </div>
          <div class="toolbar-box">
            <div :class="{ 'reset-actions': true, disabled: resetBtnDisabled || controlLoading }">
              <button @click="handleHeaderControl('reset')" class="toolbar-btn">恢复原图</button>
            </div>
            <div class="step-actions">
              <span :class="{ disabled: resetBtnDisabled || controlLoading }">
                <button :class="['toolbar-btn']" @click="handleHeaderControl('rollback')">
                  <svg-icon name="step" />
                </button>
              </span>
              <span :class="{ disabled: forwardBtnDisabled || controlLoading }">
                <button
                  class="toolbar-btn flip"
                  @click="handleHeaderControl('forward')"
                >
                  <svg-icon name="step" />
                </button>
              </span>
            </div>
            <div class="confirm-actions">
              <span>
                <button class="toolbar-btn primary-text" @click="handleClose">取消</button>
              </span>
              <span :class="{ disabled: !controlsShow || controlLoading }">
                <button @click="handleExportImage" class="toolbar-btn primary">确定</button>
              </span>
            </div>
          </div>
        </header>
        <div class="image-content">
          <div class="image-box" ref="imageBoxRef">
            <svg-icon v-if="aiLoading" class="image-loading" :style="aiLoadingBoxSize" name="loading" :size="5" />
            <slot></slot>
            <!-- 进度条放在图片区域内 -->
            <transition name="fade">
              <div v-if="showProgressBar" class="main-loading">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ transform: `scaleX(${progress / 100})` }">
                  </div>
                </div>
                <div class="progress-percentage">{{ Math.floor(progress) }}%</div>
              </div>
            </transition>
          </div>
          <div v-if="activeTab === 'crop' && controlsShow" class="image-rotate-box">
            <AngleAdjustment v-model="rotateAngle" :max-angle="180"></AngleAdjustment>
          </div>
        </div>
      </div>
    </div>
    <!-- 透明全屏遮罩，阻止用户操作 -->
    <div v-if="nowLoading" class="full-screen-blocker"></div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, computed, type ComputedRef } from 'vue';
import useProgressBar from './useProgressBar';
import SvgIcon from './SvgIcon.vue';
import { type IDrawCanvasInfo } from '@pixpro/core';
import AngleAdjustment from './AngleAdjustment.vue';
import ColoredBtn from './ColoredBtn.vue';
import EraserSizeSlider from './EraserSizeSlider.vue';
import { controlTextData, cropControlData, colorListData } from './config';
import {
  MIN_REMOVE_BG_WIDTH,
  MIN_REMOVE_BG_HEIGHT,
  MAX_HD_IMAGE_WIDTH,
  MAX_HD_IMAGE_HEIGHT,
  MIN_HD_IMAGE_WIDTH,
  MIN_HD_IMAGE_HEIGHT,
  MIN_EXPAND_IMAGE_WIDTH,
  MIN_EXPAND_IMAGE_HEIGHT,
  MAX_EXPAND_IMAGE_WIDTH,
  MAX_EXPAND_IMAGE_HEIGHT,
  MIN_ERASE_IMAGE_WIDTH,
  MIN_ERASE_IMAGE_HEIGHT,
  MAX_ERASE_IMAGE_WIDTH,
  MAX_ERASE_IMAGE_HEIGHT
} from './constants';

type TabType = 'crop' | 'erase' | 'remove-bg' | 'hd' | 'compress' | 'expand';


const nowLoading = defineModel<boolean>('loading');

const nowWidth = defineModel<number>('width');

const nowHeight = defineModel<number>('height');

const imgCurrentWidth = defineModel<number>('img-current-width');

const imgCurrentHeight = defineModel<number>('img-current-height');

const allowRemoveBg = computed(() => (nowWidth.value ?? 0) > MIN_REMOVE_BG_WIDTH && (nowHeight.value ?? 0) > MIN_REMOVE_BG_HEIGHT)

/** 是否允许提升解析度 */
const allowHd = computed(() => {
  const width = nowWidth.value ?? 0
  const height = nowHeight.value ?? 0
  return width > MIN_HD_IMAGE_WIDTH && height > MIN_HD_IMAGE_HEIGHT && width < MAX_HD_IMAGE_WIDTH && height < MAX_HD_IMAGE_HEIGHT
})

/** 是否允许扩图 */
const allowExpand = computed(() => {
  const width = imgCurrentWidth.value ?? 0
  const height = imgCurrentHeight.value ?? 0
  return width > MIN_EXPAND_IMAGE_WIDTH && height > MIN_EXPAND_IMAGE_HEIGHT && width < MAX_EXPAND_IMAGE_WIDTH && height < MAX_EXPAND_IMAGE_HEIGHT
})

/** 是否允许擦除 */
const allowErase = computed(() => {
  const width = nowWidth.value ?? 0
  const height = nowHeight.value ?? 0
  return width > MIN_ERASE_IMAGE_WIDTH && height > MIN_ERASE_IMAGE_HEIGHT && width < MAX_ERASE_IMAGE_WIDTH && height < MAX_ERASE_IMAGE_HEIGHT
})

/** 进度条相关逻辑 */
const { showProgressBar, progress } = useProgressBar(nowLoading);

/** 橡皮擦大小 */
const eraserSize = ref(50);

const props = defineProps<{
  aiLoading: boolean;
  isOperate: boolean;
  stepIndex: number;
  stepList: IDrawCanvasInfo[];
  realTimeStep: IDrawCanvasInfo | null;
  disabledForm: boolean;
  cropRatios?: Record<string, number>;
}>();

const controlLoading = computed(() => props.aiLoading);

const aiLoading = computed(() => props.aiLoading);

const controlsShow = computed(() => props.isOperate);

const currentStepIndex = computed(() => props.stepIndex);

const currentStep = computed(() => props.stepList[currentStepIndex.value]);

const cropRationLabel = computed(() => currentStep.value?.cropRationLabel || 'none');

const currentColor = computed(() => currentStep.value?.bgColor || 'transparent');

const cropRatios = computed(() => props.cropRatios || cropControlData);

const showCropRatios = computed(() => {
  return Object.keys(cropRatios.value).length > 1
})

const activeTab: ComputedRef<TabType> = computed(() => {
  return currentStep.value?.mode || 'crop'
});

const rotateAngle = computed({
  set: (newVal: number) => {
    emit('rotate', newVal);
  },
  get: () => {
    return props.realTimeStep?.rotate || 0;
  }
})

/** 清除物件按钮是否禁用 */
const eraseImageBtnDisabled = computed(() => {
  return !!currentStep.value?.erasePoints?.length
})

const imageBoxRef = ref<HTMLElement>();

const aiLoadingBoxSize = computed(() => {
  /** 获取 image-box 的宽高，计算 top 和 left，使 loading 图标居中 */
  const imageBox = imageBoxRef.value
  const imageBoxWidth = imageBox?.offsetWidth ?? 0
  const imageBoxHeight = imageBox?.offsetHeight ?? 0
  return {
    width: `${currentStep.value?.cropBoxWidth}px`,
    height: `${currentStep.value?.cropBoxHeight}px`,
    left: `${(imageBoxWidth - currentStep.value?.cropBoxWidth) / 2}px`,
    top: `${(imageBoxHeight - currentStep.value?.cropBoxHeight) / 2}px`
  }
})

/** 根据拖拽的情况来判断扩展按钮是否可以点击 */
const expandImageBtnStatus = computed(() => 
  (currentStep.value.cropBoxHeight).toFixed(4) === (currentStep.value.fenceMinHeight).toFixed(4) 
  && (currentStep.value.cropBoxWidth).toFixed(4) === (currentStep.value.fenceMinWidth).toFixed(4)
  && currentStep.value.xDomOffset === 0
  && currentStep.value.yDomOffset === 0
)

/** 禁用恢复原图按钮和返回上一步按钮 */
const resetBtnDisabled = computed(() => currentStepIndex.value < 1);

/** 禁用前进按钮 */
const forwardBtnDisabled = computed(() => currentStepIndex.value >= props.stepList.length - 1);

const emit = defineEmits([
  'handle-close',
  'rollback',
  'forward',
  'reset',
  'flip',
  'crop-ratio',
  'turn',
  'rotate',
  'export-image',
  'expand-image',
  'expand-image-btn',
  'erase-image',
  'switch-erase-image',
  'set-eraser-size',
  'remove-bg',
  'switch-mode',
  'hd',
  'color-change',
  'handleSizeChange'
]);

/** 关闭 */
function handleClose() {
  emit('handle-close');
}

/** 顶部操作区 */
function handleHeaderControl(key: 'reset' | 'forward' | 'rollback') {
  emit(key);
}

function handleSizeChange(direction: 'width' | 'height') {
  emit('handleSizeChange', direction);
}

const controlText = ref(controlTextData)

// const cropControl = ref(cropControlData)

const colorList = ref(colorListData)

const switchTab = (tab: TabType) => {
  const oldMode = activeTab.value;

  emit('switch-mode', { oldMode, newMode: tab });
  if (tab === 'erase') {
    setTimeout(() => {
      handleSetEraserSize(eraserSize.value);
    }, 500)
  }
}

/** 修改颜色 */
function handleColorChange(color: string) {
  emit('color-change', color);
}

/** 按比例裁剪 */
function handleCropRatio(ratio: number, label: string) {
  emit('crop-ratio', {
    ratio,
    label
  });
}

watch(rotateAngle, (newVal) => {
  handleRotate(newVal);
})

/** 旋转 */
function handleRotate(angle: number) {
  emit('rotate', angle);
}

function handleFlip(flip: 'x' | 'y') {
  emit('flip', flip);
}

function handleTurn(direction: 'left' | 'right') {
  emit('turn', direction);
}

watch(eraserSize, (newVal) => {
  handleSetEraserSize(newVal);
}, { immediate: true })

function handleSetEraserSize(size: number) {
  emit('set-eraser-size', size);
}

/** 导出图片 */
function handleExportImage() {
  emit('export-image');
}

/** 一键移除背景 */
function handleRemoveBg() {
  emit('remove-bg');
}

/** 一键提升解析度 */
function handleHd() {
  emit('hd');
}

/** 清除物件 */
function handleErase() {
  emit('erase-image');
}

/** 一键扩图 */
function handleExpandImage() {
  emit('expand-image-btn');
}

/** 获取比例图标样式 */
function getRatioStyle(ratio: number): Record<string, string> {
  const MAX_SIZE = 17; // 最大尺寸
  const BORDER_WIDTH = 2; // 边框宽度也适当减小
  const BORDER_RADIUS = 3; // 圆角大小也适当减小
  
  let width, height;
  
  if (ratio >= 1) {
    // 宽大于等于高
    width = MAX_SIZE;
    height = MAX_SIZE / ratio;
  } else {
    // 高大于宽
    height = MAX_SIZE;
    width = MAX_SIZE * ratio;
  }
  
  return {
    display: 'inline-block',
    width: `${width}px`,
    height: `${height}px`,
    border: `${BORDER_WIDTH}px solid`,
    borderRadius: `${BORDER_RADIUS}px`,
    boxSizing: 'border-box'
  };
}

</script>

<style lang="less" scoped>
@import './index.less';

// 为裁剪比例图标添加样式
.icon-btn {
  > i {
    transform: scale(1.1);
  }
  figure {
    width: 30px;
    height: 20px;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    i {
      border-color: #2a3246 !important;
    }
  }
}
</style>

