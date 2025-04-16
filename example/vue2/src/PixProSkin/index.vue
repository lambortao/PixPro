<template>
  <main class="editor-main">
    <div class="pix-pro-container">
      <button v-if="false" title="关闭" class="close-btn close" @click="handleClose">
        <svg-icon name="close" />
      </button>

      <!-- 侧边栏 -->
      <nav>
        <menu :class="{ disabled: !controlsShow || controlLoading }">
          <span class="menu-bg" :style="menuBgStyle"></span>
          <div v-for="(value, key) in controlText" :key="key" @click="switchTab(key)" :class="{ active: activeTab === key }">
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
          <h3>{{ controlText[activeTab].title }}</h3>
          <small v-if="controlText[activeTab].desc">{{ controlText[activeTab].desc }}</small>
        </div>
        <div class="control-content">
          <div class="crop" v-if="activeTab === 'crop' || activeTab === 'expand'">
            <div class="section" v-if="showCropRatios">
              <div class="ratio-bg" :style="ratioBgStyle"></div>
              <div v-for="(item, key) in cropRatiosComputed" class="icon-btn" :key="key" :class="{ active: key === cropRationLabel, disabled: controlLoading }" @click="handleCropRatio(item, key)">
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
                  <input type="number" v-model="width" :disabled="true" @blur="() => handleSizeChange('width')" @keyup.enter="() => handleSizeChange('width')" />
                </div>
                <div class="input-group">
                  <label>高度 (像素)</label>
                  <input type="number" v-model="height" :disabled="true" @blur="() => handleSizeChange('height')" @keyup.enter="() => handleSizeChange('height')" />
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
              <colored-btn @click="handleExpandImage" :loading="aiLoading" text="一键扩展" :disabled="expandImageBtnStatus || controlLoading || tooSmallExpand || tooLargeExpand" />
              <p class="error-text" v-if="tooSmallExpand">图片分辨率需大于 {{ MIN_EXPAND_IMAGE_WIDTH }} x {{ MIN_EXPAND_IMAGE_HEIGHT }}</p>
              <p class="error-text" v-if="tooLargeExpand">图片分辨率需小于 {{ MAX_EXPAND_IMAGE_WIDTH }} x {{ MAX_EXPAND_IMAGE_HEIGHT }}</p>
            </div>
          </div>
          <div class="erase" v-if="activeTab === 'erase'">
            <div class="section">
              <EraserSizeSlider v-model="eraserDefaultSize" :min="eraserSize.min" :max="eraserSize.max" />
              <colored-btn text="一键擦除" :loading="aiLoading" :disabled="!eraseImageBtnDisabled || tooSmallErase || tooLargeErase" @click="handleErase" />
              <p class="error-text" v-if="tooSmallErase">图片分辨率需大于 {{ MIN_ERASE_IMAGE_WIDTH }} x {{ MIN_ERASE_IMAGE_HEIGHT }}</p>
              <p class="error-text" v-if="tooLargeErase">图片分辨率需小于 {{ MAX_ERASE_IMAGE_WIDTH }} x {{ MAX_ERASE_IMAGE_HEIGHT }}</p>
            </div>
          </div>
          <div v-if="activeTab === 'remove-bg'" class="remove-bg">
            <div class="section">
              <colored-btn @click="handleRemoveBg" :loading="aiLoading" :disabled="tooSmallRemoveBg || tooLargeRemoveBg" text="一键移除" />
              <p class="error-text" v-if="tooSmallRemoveBg">图片分辨率需大于 {{ MIN_REMOVE_BG_WIDTH }} x {{ MIN_REMOVE_BG_HEIGHT }}</p>
              <p class="error-text" v-if="tooLargeRemoveBg">图片分辨率需小于 {{ MAX_REMOVE_BG_WIDTH }} x {{ MAX_REMOVE_BG_HEIGHT }}</p>
              <span class="line"></span>
              <div class="color-list">
                <small>背景颜色</small>
                <div class="color-box">
                  <div v-for="item in allColorsList" :class="[{ 'color-item': true, active: item === currentColor }, { transparent: item === 'transparent' }]" :key="item" @click="handleColorChange(item)">
                    <span :style="{ backgroundColor: item }"></span>
                    <svg-icon v-if="localColorList.includes(item) && item !== currentColor" class="close-icon" name="close" @click.stop="removeLocalColorStorage(item)" />
                  </div>
                  <add-new-color v-model="colorBoxVisible" @confirm="handleAddNewColor" />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeTab === 'hd'" class="hd">
            <div class="section">
              <colored-btn @click="handleHd" :loading="aiLoading" text="一键提升" :disabled="tooSmallHd || tooLargeHd" />
              <p class="error-text" v-if="tooSmallHd">图片分辨率需大于 {{ MIN_HD_IMAGE_WIDTH }} x {{ MIN_HD_IMAGE_HEIGHT }}</p>
              <p class="error-text" v-if="tooLargeHd">图片分辨率需小于 {{ MAX_HD_IMAGE_WIDTH }} x {{ MAX_HD_IMAGE_HEIGHT }}</p>
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
            <span v-if="width || height">目标图片分辨率：{{ width }} x {{ height }}</span>
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
                <button class="toolbar-btn flip" @click="handleHeaderControl('forward')">
                  <svg-icon name="step" />
                </button>
              </span>
            </div>
            <div class="confirm-actions">
              <span>
                <button :disabled="buttonLoading" class="toolbar-btn primary-text" @click="handleClose">取消</button>
              </span>
              <span :class="{ disabled: !controlsShow || controlLoading }">
                <button v-if="showDownloadBtn" @click="handleDownloadImage" :disabled="buttonLoading" :class="[{ 'toolbar-btn': true, primary: !buttonLoading, disabled: buttonLoading }]">下载</button>
                <button v-else @click="handleExportImage" class="toolbar-btn primary">确认</button>
              </span>
            </div>
          </div>
        </header>
        <div class="image-content">
          <div class="image-box" ref="imageBoxRef">
            <AiLoading v-if="aiLoading" class="image-loading" :style="aiLoadingBoxSize" :width="aiLoadingBoxSize.width" :height="aiLoadingBoxSize.height" />
            <slot></slot>
            <!-- 进度条放在图片区域内 -->
            <transition name="fade">
              <div v-if="showProgressBar" class="main-loading">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ transform: `scaleX(${progress / 100})` }"></div>
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
    <div v-if="loading" class="full-screen-blocker"></div>
  </main>
</template>

<script>
import AiLoading from "./components/AiLoading.vue";
import useProgressBar from "./hooks/useProgressBar";
import SvgIcon from "./components/SvgIcon.vue";
import AddNewColor from "./components/AddNewColor.vue";
import AngleAdjustment from "./components/AngleAdjustment.vue";
import ColoredBtn from "./components/ColoredBtn.vue";
import EraserSizeSlider from "./components/EraserSizeSlider.vue";
import { controlTextData, cropControlData } from "./hooks/config";
import useColors from "./hooks/useColors";
import { MIN_REMOVE_BG_WIDTH, MIN_REMOVE_BG_HEIGHT, MAX_REMOVE_BG_WIDTH, MAX_REMOVE_BG_HEIGHT, MAX_HD_IMAGE_WIDTH, MAX_HD_IMAGE_HEIGHT, MIN_HD_IMAGE_WIDTH, MIN_HD_IMAGE_HEIGHT, MIN_EXPAND_IMAGE_WIDTH, MIN_EXPAND_IMAGE_HEIGHT, MAX_EXPAND_IMAGE_WIDTH, MAX_EXPAND_IMAGE_HEIGHT, MIN_ERASE_IMAGE_WIDTH, MIN_ERASE_IMAGE_HEIGHT, MAX_ERASE_IMAGE_WIDTH, MAX_ERASE_IMAGE_HEIGHT } from "../../../../src/config/constants";

export default {
  name: "PixProSkin",
  components: {
    AiLoading,
    SvgIcon,
    AddNewColor,
    AngleAdjustment,
    ColoredBtn,
    EraserSizeSlider,
  },
  props: {
    aiLoading: Boolean,
    isOperate: Boolean,
    stepIndex: Number,
    stepList: Array,
    realTimeStep: Object,
    disabledForm: Boolean,
    cropRatios: {
      type: Object,
      default: () => null,
    },
    showDownloadBtn: {
      type: Boolean,
      default: false,
    },
    buttonLoading: {
      type: Boolean,
      default: false,
    },
    nowMode: String,
    eraserSize: {
      type: Object,
      default: () => ({
        min: 10,
        max: 100,
        default: 50,
      }),
    },
  },
  data() {
    return {
      loading: false,
      width: 0,
      height: 0,
      imgCurrentWidth: 0,
      imgCurrentHeight: 0,
      eraserDefaultSize: 50,
      cropData: {
        proportions: "none",
        width: 0,
        height: 0,
        rotate: 0,
      },
      controlText: controlTextData,
      cropControl: cropControlData,
      imageBoxRef: null,
    };
  },
  mixins: [useProgressBar, useColors],
  computed: {
    controlLoading() {
      return this.aiLoading;
    },
    controlsShow() {
      return this.isOperate;
    },
    currentStepIndex() {
      return this.stepIndex;
    },
    currentStep() {
      return this.stepList?.[this.currentStepIndex];
    },
    cropRationLabel() {
      return this.currentStep?.cropRationLabel || "none";
    },
    currentColor() {
      return this.currentStep?.bgColor || "transparent";
    },
    showCropRatios() {
      return Object.keys(this.cropRatiosComputed).length > 1;
    },
    activeTab() {
      return this.currentStep?.mode || "crop";
    },
    menuBgStyle() {
      const menuItems = Object.keys(this.controlText);
      const activeIndex = menuItems.indexOf(this.activeTab);
      const itemHeight = 44;
      const itemMargin = 5;
      const top = activeIndex * (itemHeight + itemMargin);

      return {
        transform: `translateY(${top}px)`,
      };
    },
    ratioBgStyle() {
      const ratioItems = Object.keys(this.cropRatiosComputed);
      const activeIndex = ratioItems.indexOf(this.cropRationLabel);
      if (activeIndex === -1 || this.cropRationLabel === "none") {
        return {};
      }
      const itemHeight = 36;
      const itemMargin = 5;
      const top = activeIndex * (itemHeight + itemMargin);

      return {
        transform: `translateY(${top}px)`,
        backgroundColor: "#e6e6e6",
      };
    },
    rotateAngle: {
      get() {
        return this.realTimeStep?.rotate || 0;
      },
      set(newVal) {
        this.$emit("rotate", newVal);
      },
    },
    eraseImageBtnDisabled() {
      return !!this.currentStep?.erasePoints?.length;
    },
    aiLoadingBoxSize() {
      const imageBox = this.$refs.imageBoxRef;
      const imageBoxWidth = imageBox?.offsetWidth ?? 0;
      const imageBoxHeight = imageBox?.offsetHeight ?? 0;
      return {
        width: `${this.currentStep?.cropBoxWidth}px`,
        height: `${this.currentStep?.cropBoxHeight}px`,
        left: `${(imageBoxWidth - this.currentStep?.cropBoxWidth) / 2}px`,
        top: `${(imageBoxHeight - this.currentStep?.cropBoxHeight) / 2}px`,
      };
    },
    expandImageBtnStatus() {
      return this.currentStep.cropBoxHeight.toFixed(4) === this.currentStep.fenceMinHeight.toFixed(4) && this.currentStep.cropBoxWidth.toFixed(4) === this.currentStep.fenceMinWidth.toFixed(4) && this.currentStep.xDomOffset === 0 && this.currentStep.yDomOffset === 0;
    },
    resetBtnDisabled() {
      return this.currentStepIndex < 1;
    },
    forwardBtnDisabled() {
      return this.currentStepIndex >= this.stepList.length - 1;
    },
    tooSmallRemoveBg() {
      return (this.width ?? 0) < MIN_REMOVE_BG_WIDTH || (this.height ?? 0) < MIN_REMOVE_BG_HEIGHT;
    },
    tooLargeRemoveBg() {
      return (this.width ?? 0) > MAX_REMOVE_BG_WIDTH || (this.height ?? 0) > MAX_REMOVE_BG_HEIGHT;
    },
    tooSmallHd() {
      return this.width < MIN_HD_IMAGE_WIDTH || this.height < MIN_HD_IMAGE_HEIGHT;
    },
    tooLargeHd() {
      return this.width > MAX_HD_IMAGE_WIDTH || this.height > MAX_HD_IMAGE_HEIGHT;
    },
    allowExpand() {
      return this.imgCurrentWidth > MIN_EXPAND_IMAGE_WIDTH && this.imgCurrentHeight > MIN_EXPAND_IMAGE_HEIGHT && this.imgCurrentWidth < MAX_EXPAND_IMAGE_WIDTH && this.imgCurrentHeight < MAX_EXPAND_IMAGE_HEIGHT;
    },
    tooSmallExpand() {
      return this.imgCurrentWidth < MIN_EXPAND_IMAGE_WIDTH || this.imgCurrentHeight < MIN_EXPAND_IMAGE_HEIGHT;
    },
    tooLargeExpand() {
      return this.imgCurrentWidth > MAX_EXPAND_IMAGE_WIDTH || this.imgCurrentHeight > MAX_EXPAND_IMAGE_HEIGHT;
    },
    allowErase() {
      return this.width > MIN_ERASE_IMAGE_WIDTH && this.height > MIN_ERASE_IMAGE_HEIGHT && this.width < MAX_ERASE_IMAGE_WIDTH && this.height < MAX_ERASE_IMAGE_HEIGHT;
    },
    tooSmallErase() {
      return this.width < MIN_ERASE_IMAGE_WIDTH || this.height < MIN_ERASE_IMAGE_HEIGHT;
    },
    tooLargeErase() {
      return this.width > MAX_ERASE_IMAGE_WIDTH || this.height > MAX_ERASE_IMAGE_HEIGHT;
    },
    cropRatiosComputed() {
      return this.cropRatios || cropControlData;
    },
  },
  watch: {
    rotateAngle(newVal) {
      if (this.nowMode === "crop") {
        this.handleRotate(newVal);
      }
    },
    eraserDefaultSize: {
      handler(newVal) {
        this.$emit("set-eraser-size", newVal);
      },
      immediate: true,
    },
  },
  methods: {
    handleDownloadImage() {
      this.$emit("handleDownloadImage");
    },
    handleClose() {
      this.$emit("handle-close");
    },
    handleHeaderControl(key) {
      this.$emit(key);
    },
    handleSizeChange(direction) {
      this.$emit("handleSizeChange", direction);
    },
    handleColorChange(color) {
      console.log(color);
      this.$emit("color-change", color);
    },
    switchTab(tab) {
      const oldMode = this.activeTab;
      this.$emit("switch-mode", { oldMode, newMode: tab });
    },
    handleCropRatio(ratio, label) {
      this.$emit("crop-ratio", {
        ratio,
        label,
      });
    },
    handleRotate(angle) {
      this.$emit("rotate", angle);
    },
    handleFlip(flip) {
      this.$emit("flip", flip);
    },
    handleTurn(direction) {
      this.$emit("turn", direction);
    },
    handleExportImage() {
      this.$emit("export-image");
    },
    handleRemoveBg() {
      this.$emit("remove-bg");
    },
    handleHd() {
      this.$emit("hd");
    },
    handleErase() {
      this.$emit("erase-image");
    },
    handleExpandImage() {
      this.$emit("expand-image-btn");
    },
    getRatioStyle(ratio) {
      const MAX_SIZE = 17;
      const BORDER_WIDTH = 2;
      const BORDER_RADIUS = 3;

      let width, height;

      if (ratio >= 1) {
        width = MAX_SIZE;
        height = MAX_SIZE / ratio;
      } else {
        height = MAX_SIZE;
        width = MAX_SIZE * ratio;
      }

      return {
        display: "inline-block",
        width: `${width}px`,
        height: `${height}px`,
        border: `${BORDER_WIDTH}px solid`,
        borderRadius: `${BORDER_RADIUS}px`,
        boxSizing: "border-box",
      };
    },
  },
  mounted() {
    console.log(this.cropRatiosComputed, "cropRatiosComputed");
  },
};
</script>

<style lang="less" scoped>
@import "./assets/style/index.less";

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
      transform: scale(1.1);
    }
  }
}
</style>
