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
              <div v-for="(item, key) in cropRatiosCom" class="icon-btn" :key="key" :class="{ active: key === cropRationLabel, disabled: controlLoading }" @click="handleCropRatio(item, key)">
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
                  <input type="number" :value="nowWidth" :disabled="controlLoading" @blur="handleSizeChange('width', $event)" @keyup.enter="handleSizeChange('width', $event)" />
                </div>
                <div class="input-group">
                  <label>高度 (像素)</label>
                  <input type="number" :value="nowHeight" :disabled="controlLoading" @blur="handleSizeChange('height', $event)" @keyup.enter="handleSizeChange('height', $event)" />
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
              <colored-btn @click="handleExpandImage" :loading="aiLoadingCom" text="一键扩展" :disabled="expandImageBtnStatus || controlLoading || tooSmallExpand || tooLargeExpand" />
              <p class="error-text" v-if="tooSmallExpand">图片分辨率需大于 {{ constantsData?.MIN_EXPAND_IMAGE_WIDTH }} x {{ constantsData?.MIN_EXPAND_IMAGE_HEIGHT }}</p>
              <p class="error-text" v-if="tooLargeExpand">图片分辨率需小于 {{ constantsData?.MAX_EXPAND_IMAGE_WIDTH }} x {{ constantsData?.MAX_EXPAND_IMAGE_HEIGHT }}</p>
            </div>
          </div>
          <div class="erase" v-if="activeTab === 'erase'">
            <div class="section">
              <EraserSizeSlider v-model:size="eraserDefaultSizeData" :min="eraserSize.min" :max="eraserSize.max" />
              <colored-btn text="一键擦除" :loading="aiLoadingCom" :disabled="!eraseImageBtnDisabled || tooSmallErase || tooLargeErase" @click="handleErase" />
              <p class="error-text" v-if="tooSmallErase">图片分辨率需大于 {{ constantsData?.MIN_ERASE_IMAGE_WIDTH }} x {{ constantsData?.MIN_ERASE_IMAGE_HEIGHT }}</p>
              <p class="error-text" v-if="tooLargeErase">图片分辨率需小于 {{ constantsData?.MAX_ERASE_IMAGE_WIDTH }} x {{ constantsData?.MAX_ERASE_IMAGE_HEIGHT }}</p>
            </div>
          </div>
          <div v-if="activeTab === 'remove-bg'" class="remove-bg">
            <div class="section">
              <colored-btn @click="handleRemoveBg" :loading="aiLoadingCom" :disabled="tooSmallRemoveBg || tooLargeRemoveBg" text="一键移除" />
              <p class="error-text" v-if="tooSmallRemoveBg">图片分辨率需大于 {{ constantsData?.MIN_REMOVE_BG_WIDTH }} x {{ constantsData?.MIN_REMOVE_BG_HEIGHT }}</p>
              <p class="error-text" v-if="tooLargeRemoveBg">图片分辨率需小于 {{ constantsData?.MAX_REMOVE_BG_WIDTH }} x {{ constantsData?.MAX_REMOVE_BG_HEIGHT }}</p>
              <span class="line"></span>
              <div class="color-list">
                <small>背景颜色</small>
                <div class="color-box">
                  <div v-for="item in allColorsList" :class="[{ 'color-item': true, active: item === currentColor }, { transparent: item === 'transparent' }]" :key="item" @click="handleColorChange(item)">
                    <span :style="{ backgroundColor: item }"></span>
                    <svg-icon v-if="localColorList.includes(item) && item !== currentColor" class="close-icon" name="close" @click.native.stop="handleRemoveLocalColorStorage($event, item)" />
                  </div>
                  <add-new-color v-model:visible="colorBoxVisible" @confirm="useColorsData.handleAddNewColor" />
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeTab === 'hd'" class="hd">
            <div class="section">
              <colored-btn @click="handleHd" :loading="aiLoadingCom" text="一键提升" :disabled="tooSmallHd || tooLargeHd" />
              <p class="error-text" v-if="tooLargeHd">图片单边分辨率<br />大于等于 {{ constantsData?.MAX_HD_IMAGE_WIDTH < constantsData?.MAX_HD_IMAGE_HEIGHT ? constantsData?.MAX_HD_IMAGE_WIDTH : constantsData?.MAX_HD_IMAGE_HEIGHT }}px 不适用提升</p>
              <p class="error-text" v-if="tooSmallHd">图片单边分辨率<br />小于等于 {{ constantsData?.MIN_HD_IMAGE_WIDTH < constantsData?.MIN_HD_IMAGE_HEIGHT ? constantsData?.MIN_HD_IMAGE_WIDTH : constantsData?.MIN_HD_IMAGE_HEIGHT }}px 不适用提升</p>
            </div>
          </div>
          <div v-if="activeTab === 'compress'" class="compress">
            <div class="section">
              <colored-btn text="一键压缩" :loading="aiLoadingCom" />
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
                <button class="toolbar-btn flip" @click="handleHeaderControl('forward')">
                  <svg-icon name="step" />
                </button>
              </span>
            </div>
            <div class="confirm-actions">
              <span>
                <button :disabled="buttonLoadingCom" class="toolbar-btn primary-text" @click="handleClose">取消</button>
              </span>
              <span :class="{ disabled: !controlsShow || controlLoading }">
                <button v-if="showDownloadBtnCom" @click="handleDownloadImage" :disabled="buttonLoadingCom" :class="[{ 'toolbar-btn': true, primary: !buttonLoadingCom, disabled: buttonLoadingCom }]">下载</button>
                <button v-else @click="handleExportImage" class="toolbar-btn primary">确认</button>
              </span>
            </div>
          </div>
        </header>
        <div class="image-content">
          <div class="image-box" ref="imageBoxRef">
            <transition name="fade">
              <ai-loading v-if="aiLoadingCom" class="image-loading" :style="aiLoadingBoxSize" :width="aiLoadingBoxSize.width" :height="aiLoadingBoxSize.height" />
            </transition>
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
            <AngleAdjustment v-model="rotateAngle" :max-angle="180" @handle-remind-image="showRemindImage"></AngleAdjustment>
          </div>
        </div>
      </div>
    </div>
    <!-- 透明全屏遮罩，阻止用户操作 -->
    <div v-if="nowLoading" class="full-screen-blocker"></div>
  </main>
</template>

<script>
import AiLoading from "./components/AiLoading.vue";
import SvgIcon from "./components/SvgIcon.vue";
import AddNewColor from "./components/AddNewColor.vue";
import AngleAdjustment from "./components/AngleAdjustment.vue";
import ColoredBtn from "./components/ColoredBtn.vue";
import EraserSizeSlider from "./components/EraserSizeSlider.vue";
import { controlTextData, cropControlData } from "./hooks/config";
import useColors from "./hooks/useColors";
import useProgressBar from "./hooks/useProgressBar";
import constants from "./hooks/constants";
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
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    imgCurrentWidth: {
      type: Number,
    },
    imgCurrentHeight: {
      type: Number,
    },
    loading: {
      type: Boolean,
    },
    eraserDefaultSize: {
      type: Number,
      required: true,
      default: 50,
    },
    aiLoading: {
      type: Boolean,
      default: false,
    },
    isOperate: {
      type: Boolean,
      default: false,
    },
    stepIndex: {
      type: Number,
      default: 0,
    },
    stepList: {
      type: Array,
      default: () => [],
    },
    realTimeStep: {
      type: Object,
      default: null,
    },
    disabledForm: {
      type: Boolean,
      default: false,
    },
    cropRatios: {
      type: Object,
      default: () => ({}),
    },
    showDownloadBtn: {
      type: Boolean,
      default: true,
    },
    buttonLoading: {
      type: Boolean,
      default: false,
    },
    nowMode: {
      type: String,
      default: "crop",
    },
    eraserSize: {
      type: Object,
      default: () => ({
        min: 20,
        max: 100,
        default: 50,
      }),
    },
  },
  mixins: [useProgressBar],
  data() {
    return {
      nowLoading: this.loading,
      rotateAngle: this.realTimeStep?.rotate || 0,
      imageBoxRef: null,
      MIN_EXPAND_RATIO: 0.01,
      controlText: controlTextData,
      colorBoxVisible: false,
      localColorList: [],
      allColorsList: [],
      constantsData: constants,
      eraserDefaultSizeData: this.eraserDefaultSize,
      useColorsData: null,
      currentColor: this.currentStep?.bgColor || "transparent",
      isProcessingEvent: false,
      showProgressBar: false,
      progress: 0,
      fastFinish: false,
    };
  },
  mounted() {
    // 初始化进度条相关数据
    this.showProgressBar = false;
    this.progress = 0;
    this.fastFinish = false;

    // 初始化 useColors
    this.useColorsData = useColors(this.handleColorChange, this.currentColor);
    this.colorBoxVisible = this.useColorsData.colorBoxVisible;
    this.localColorList = this.useColorsData.localColorList;
    this.allColorsList = this.useColorsData.allColorsList;

    // 监听颜色列表变化，更新本地状态
    this.$watch(
      () => this.useColorsData.allColorsList,
      (newVal) => {
        this.allColorsList = newVal;
      }
    );

    this.$watch(
      () => this.useColorsData.localColorList,
      (newVal) => {
        this.localColorList = newVal;
      }
    );

    this.imageBoxRef = this.$refs.imageBoxRef;
  },
  methods: {
    handleClose() {
      this.$emit("handle-close");
    },
    handleHeaderControl(key) {
      this.$emit(key);
    },
    handleSizeChange(direction, e) {
      const targetValue = parseInt(e.target.value);
      if (targetValue) {
        if (direction === "width" && targetValue !== this.width) {
          this.$emit("handleSizeChange", direction, targetValue);
        }
        if (direction === "height" && targetValue !== this.height) {
          this.$emit("handleSizeChange", direction, targetValue);
        }
      }
    },
    handleColorChange(color) {
      // 如果当前正在处理其他事件，则不执行颜色更改
      if (this.isProcessingEvent) {
        return;
      }
      console.log(123);
      this.currentColor = color;
      this.$emit("color-change", color);
    },
    handleRemoveLocalColorStorage(e, color) {
      // 设置事件锁，防止触发其他事件
      this.isProcessingEvent = true;

      // 阻止事件冒泡
      e.stopPropagation();

      // 调用删除方法
      this.useColorsData.removeLocalColorStorage(color);

      // 使用延时，确保事件处理完成后才释放锁
      setTimeout(() => {
        this.isProcessingEvent = false;
      }, 10);
    },
    handleCropRatio(ratio, label) {
      this.$emit("crop-ratio", { ratio, label });
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
    handleErase() {
      this.$emit("erase-image");
    },
    handleRemoveBg() {
      this.$emit("remove-bg");
    },
    handleHd() {
      this.$emit("hd");
    },
    handleExpandImage() {
      this.$emit("expand-image-btn");
    },
    handleExportImage() {
      this.$emit("export-image");
    },
    handleDownloadImage() {
      this.$emit("handleDownloadImage");
    },
    showRemindImage(visible) {
      this.$emit("show-remind-image", visible);
    },
    switchTab(tab) {
      const oldMode = this.activeTab;
      this.$emit("switch-mode", { oldMode, newMode: tab });
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
  computed: {
    controlLoading() {
      return this.aiLoading;
    },
    aiLoadingCom() {
      return this.aiLoading;
    },
    controlsShow() {
      return this.isOperate;
    },
    currentStepIndex() {
      return this.stepIndex;
    },
    resetBtnDisabled() {
      return this.currentStepIndex < 1;
    },
    stepListCom() {
      return this.stepList;
    },
    forwardBtnDisabled() {
      return this.currentStepIndex >= this.stepListCom?.length - 1;
    },
    currentStep() {
      return this.stepListCom[this.currentStepIndex];
    },
    cropRationLabel() {
      return this.currentStep?.cropRationLabel || "none";
    },
    cropRatiosCom() {
      return this.cropRatios || cropControlData;
    },
    showDownloadBtnCom() {
      return this.showDownloadBtn || false;
    },
    buttonLoadingCom() {
      return this.buttonLoading || false;
    },
    showCropRatios() {
      return Object.keys(this.cropRatiosCom).length > 1;
    },
    activeTab() {
      return this.currentStep?.mode || "crop";
    },
    menuBgStyle() {
      const menuItems = Object.keys(controlTextData);
      const activeIndex = menuItems.indexOf(this.activeTab);
      /** 菜单项高度 (12px * 2 + 20px) */
      const itemHeight = 44;
      /** 菜单项间距 */
      const itemMargin = 5;
      const top = activeIndex * (itemHeight + itemMargin);

      return {
        transform: `translateY(${top}px)`,
      };
    },
    ratioBgStyle() {
      const ratioItems = Object.keys(this.cropRatios);
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
    eraseImageBtnDisabled() {
      return !!this.currentStep?.erasePoints?.length;
    },
    aiLoadingBoxSize() {
      /** 获取 image-box 的宽高，计算 top 和 left，使 loading 图标居中 */
      const imageBoxWidth = this.imageBoxRef?.offsetWidth ?? 0;
      const imageBoxHeight = this.imageBoxRef?.offsetHeight ?? 0;
      return {
        width: `${this.currentStep?.cropBoxWidth}px`,
        height: `${this.currentStep?.cropBoxHeight}px`,
        left: `${(imageBoxWidth - this.currentStep?.cropBoxWidth) / 2}px`,
        top: `${(imageBoxHeight - this.currentStep?.cropBoxHeight) / 2}px`,
      };
    },
    expandImageBtnStatus() {
      const { cropBoxHeight, cropBoxWidth, currentDomHeight, currentDomWidth, xDomOffset, yDomOffset } = this.currentStep;

      /** 向左扩展 */
      const expansion_ratio_left = xDomOffset ? (Math.abs(xDomOffset) ?? 1) / currentDomWidth : 0;
      /** 向上扩展 */
      const expansion_ratio_top = yDomOffset ? (Math.abs(yDomOffset) ?? 1) / currentDomHeight : 0;
      /** 向右扩展 */
      const expansion_ratio_right = (cropBoxWidth - currentDomWidth - Math.abs(xDomOffset ?? 1)) / currentDomWidth;
      /** 向下扩展 */
      const expansion_ratio_bottom = (cropBoxHeight - currentDomHeight - Math.abs(yDomOffset ?? 1)) / currentDomHeight;
      console.log(expansion_ratio_left, expansion_ratio_top, expansion_ratio_right, expansion_ratio_bottom);

      return expansion_ratio_left < this.MIN_EXPAND_RATIO && expansion_ratio_top < this.MIN_EXPAND_RATIO && expansion_ratio_right < this.MIN_EXPAND_RATIO && expansion_ratio_bottom < this.MIN_EXPAND_RATIO;
    },

    tooSmallRemoveBg() {
      return this.width < this.constantsData?.MIN_REMOVE_BG_WIDTH || this.height < this.constantsData?.MIN_REMOVE_BG_HEIGHT;
    },
    tooLargeRemoveBg() {
      return this.width > this.constantsData?.MAX_REMOVE_BG_WIDTH || this.height > this.constantsData?.MAX_REMOVE_BG_HEIGHT;
    },
    tooSmallHd() {
      return this.width < this.constantsData?.MIN_HD_IMAGE_WIDTH || this.height < this.constantsData?.MIN_HD_IMAGE_HEIGHT;
    },
    tooLargeHd() {
      return this.width >= this.constantsData?.MAX_HD_IMAGE_WIDTH || this.height >= this.constantsData?.MAX_HD_IMAGE_HEIGHT;
    },
    tooSmallExpand() {
      const width = this.imgCurrentWidth ?? 0;
      const height = this.imgCurrentHeight ?? 0;

      return width < this.constantsData?.MIN_EXPAND_IMAGE_WIDTH || height < this.constantsData?.MIN_EXPAND_IMAGE_HEIGHT;
    },
    tooLargeExpand() {
      const width = this.$props.imgCurrentWidth || 0;
      const height = this.$props.imgCurrentHeight || 0;
      return width > this.constantsData?.MAX_EXPAND_IMAGE_WIDTH || height > this.constantsData?.MAX_EXPAND_IMAGE_HEIGHT;
    },
    tooSmallErase() {
      return this.width < this.constantsData?.MIN_ERASE_IMAGE_WIDTH || this.height < this.constantsData?.MIN_ERASE_IMAGE_HEIGHT;
    },
    tooLargeErase() {
      return this.width > this.constantsData?.MAX_ERASE_IMAGE_WIDTH || this.height > this.constantsData?.MAX_ERASE_IMAGE_HEIGHT;
    },
    nowWidth() {
      return this.width;
    },
    nowHeight() {
      return this.height;
    },
  },
  watch: {
    realTimeStep: {
      handler(newVal) {
        this.rotateAngle = newVal?.rotate;
      },
    },
    rotateAngle: {
      handler(newVal) {
        if (this.nowMode === "crop") {
          this.handleRotate(newVal);
        }
      },
    },
    eraserDefaultSize: {
      handler(newVal) {
        this.eraserDefaultSizeData = newVal;
      },
    },
    eraserDefaultSizeData: {
      immediate: true,
      handler(newVal) {
        this.$emit("set-eraser-size", newVal);
      },
    },
    "currentStep.bgColor"(newVal) {
      this.currentColor = newVal;
    },
    loading: {
      handler(newVal) {
        this.nowLoading = newVal;
      },
    },
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
      border-color: #2a3246 !important;
    }
  }
}
</style>
