<template>
  <div>
    <pix-pro-skin
      :width.sync="width"
      :height.sync="height"
      :img-current-width.sync="imgCurrentWidth"
      :img-current-height.sync="imgCurrentHeight"
      :loading.sync="nowLoading"
      :eraser-default-size.sync="defaultEraserSize"
      :crop-ratios="cropRatios"
      :step-index="nowStepIndex"
      :step-list="nowStepList"
      :real-time-step="realTimeStep"
      :aiLoading="aiLoading"
      :button-loading="buttonLoading"
      :show-download-btn="showDownloadBtn"
      :disabled-form="disabledForm"
      :is-operate="isOperate"
      :eraser-size="eraserSize"
      :now-mode="nowMode"
      @rollback="rollback"
      @forward="forward"
      @reset="reset"
      @flip="flip"
      @crop-ratio="handleCropRatio"
      @show-remind-image="showRemindImage"
      @turn="turn"
      @rotate="handleRotate"
      @color-change="handleColorChange"
      @export-image="exportImage"
      @expand-image-btn="expandImageBtn"
      @erase-image="eraseImage"
      @set-eraser-size="setEraserSize"
      @remove-bg="handleRemoveBg"
      @switch-mode="switchMode"
      @hd="handleHd"
      @handle-close="close"
      @handle-download-image="handleDownloadImage"
      @handleSizeChange="handleSizeChange"
    >
      <div class="container" ref="photoStudioContainer" />
    </pix-pro-skin>
    <div v-if="imageSrc" @click="imageSrc = ''" class="export-img-box">
      <img :src="imageSrc" alt="" />
    </div>
  </div>
</template>

<script>
import PixProSkin from "./PixProSkin/index.vue";
/** 开发包的测试 */
import PhotoStudio from "../../../src/index";

export default {
  name: "PixProVue",
  components: {
    PixProSkin,
  },
  props: {
    token: {
      type: String,
      required: true,
    },
    host: {
      type: String,
      required: true,
    },
    cropRatios: {
      type: Object,
      default: () => ({}),
    },
    fitstImage: {
      type: File,
      default: null,
    },
    showDownloadBtn: {
      type: Boolean,
      default: false,
    },
    routes: {
      type: String,
      default: "/image/processing",
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
  data() {
    return {
      photoStudioContainer: null,
      imageStudio: null,
      nowLoading: false,
      isOperate: false,
      nowStep: null,
      nowStepList: [],
      realTimeStep: null,
      nowStepIndex: -1,
      width: 0,
      height: 0,
      imgCurrentWidth: 0,
      imgCurrentHeight: 0,
      direction: null,
      cropRatio: null,
      aiLoading: false,
      disabledForm: false,
      buttonLoading: false,
      nowMode: "crop",
      isInit: false,
      imageSrc: "",
      defaultEraserSize: this.eraserSize.default,
    };
  },
  mounted() {
    this.photoStudioContainer = this?.$refs?.photoStudioContainer;

    this.initImageStudio();
    this.$nextTick(() => {
      if (this.fitstImage) {
        this.imageStudio?.uploadFile(this.fitstImage);
      }
    });
  },
  methods: {
    initImageStudio() {
      this.imageStudio = new PhotoStudio(this.photoStudioContainer, {
        token: this.token,
        merchantId: "",
        isDev: false,
        host: this.host,
        routes: this.routes,
        eraserSize: this.eraserSize,
        action: {
          extend: "ImageExpansion",
          erase: "LocalizedImageRemoval",
          removeBg: "BackgroundRemoval",
          hd: "EnhanceImageResolution",
        },
        realTimeChange: (step) => {
          const { currentWidth, currentHeight } = this.getWH(step);
          this.width = currentWidth;
          this.height = currentHeight;
          this.realTimeStep = step;
          this.disabledForm = step.disabledForm ?? false;
          this.imgCurrentWidth = step.currentDomWidth / (step.cdProportions ?? 1);

          this.imgCurrentHeight = step.currentDomHeight / (step.cdProportions ?? 1);
          console.log(step.currentDomWidth / (step.cdProportions ?? 1));
          console.log(step.currentDomHeight / (step.cdProportions ?? 1));
        },
        onStepChange: ({ stepList, currentStepIndex }) => {
          const step = stepList[currentStepIndex];
          this.realTimeStep = step;
          this.nowStepList = stepList;
          this.nowStepIndex = currentStepIndex;
          this.nowStep = step;
          this.direction = step.direction ?? "vertical";
          const { currentWidth, currentHeight } = this.getWH(step);
          this.width = currentWidth;
          this.height = currentHeight;
          this.imgCurrentWidth = step.currentDomWidth / (step.cdProportions ?? 1);
          this.imgCurrentHeight = step.currentDomHeight / (step.cdProportions ?? 1);
          this.$nextTick(() => {
            this.aiLoading = false;
            this.nowLoading = false;
            this.disabledForm = step.disabledForm ?? false;
          });
        },
        onExportImage: (image) => {
          this.imageSrc = image;
          this.$emit("handle-export-image", image);
          this.close();
        },
        onFinish: () => {
          this.aiLoading = false;
          this.nowLoading = false;
          if (!this.isInit) {
            this.isInit = true;
            this.triggerCropRatio();
          }
        },
        onUpload: () => {
          console.log("----------onUpload");

          this.nowLoading = true;
          this.isOperate = true;
        },
        onEraserSizeChange: (size) => {
          this.eraserSize.default = size;
          this.defaultEraserSize = size;
        },
      });
    },
    getWH(step) {
      const wMultiplied = step.currentDomWidth / step.cropBoxWidth;
      const hMultiplied = step.currentDomHeight / step.cropBoxHeight;
      return {
        currentWidth: Math.round(step.rawImgWidth / (wMultiplied ?? 1)),
        currentHeight: Math.round(step.rawImgHeight / (hMultiplied ?? 1)),
      };
    },
    triggerCropRatio() {
      if (this.cropRatios && Object.keys(this.cropRatios).length === 1) {
        const ratio = this.cropRatios[Object.keys(this.cropRatios)[0]];
        console.log("触发比例裁剪", ratio, Object.keys(this.cropRatios)[0]);
        this.handleCropRatio({
          ratio,
          label: Object.keys(this.cropRatios)[0],
          isTrigger: false,
        });
      }
    },
    showRemindImage(visible) {
      this.imageStudio?.toogleRemindImage(visible);
    },
    close() {
      this.imageStudio?.resetAll();
      this.imageStudio = null;
      this.$emit("handle-close");
    },
    exportImage() {
      if (this.imageStudio) {
        this.imageStudio.exportImage();
      }
    },
    rotate(angle) {
      if (this.imageStudio) {
        this.imageStudio.rotate(angle);
      }
    },
    rollback() {
      if (this.imageStudio) {
        this.imageStudio.rollback();
      }
    },
    forward() {
      if (this.imageStudio) {
        this.imageStudio.forward();
      }
    },
    reset() {
      if (this.imageStudio) {
        this.imageStudio.reset();
      }
    },
    flip(direction) {
      if (this.imageStudio) {
        this.imageStudio.flip(direction);
      }
    },
    handleCropRatio(ratio) {
      if (this.imageStudio) {
        this.imageStudio.cropRatio(ratio);
      }
    },
    turn(direction) {
      if (this.imageStudio) {
        this.imageStudio.turn(direction);
      }
    },
    handleRotate(angle) {
      this.rotate(Number(angle));
    },
    expandImageBtn() {
      this.aiLoading = true;
      if (this.imageStudio) {
        this.imageStudio.expandImageBtn();
      }
    },
    eraseImage() {
      this.aiLoading = true;
      if (this.imageStudio) {
        this.imageStudio.eraseImage();
      }
    },
    setEraserSize(size) {
      if (this.imageStudio) {
        this.imageStudio.setEraserSize(size);
      }
    },
    handleRemoveBg() {
      this.aiLoading = true;
      if (this.imageStudio) {
        this.imageStudio.removeBg();
      }
    },
    handleColorChange(color) {
      if (this.imageStudio) {
        this.imageStudio.setRemoveBgColor(color);
      }
    },
    handleHd() {
      this.aiLoading = true;
      if (this.imageStudio) {
        this.imageStudio.hd();
      }
    },
    handleDownloadImage() {
      this.buttonLoading = true;
      if (this.imageStudio) {
        this.imageStudio.downloadImage().then(() => {
          this.buttonLoading = false;
        });
      }
    },
    switchMode({ oldMode, newMode }) {
      if (oldMode === newMode) return;
      if (this.imageStudio) {
        this.imageStudio.switchMode(oldMode, newMode);
      }
      this.nowMode = newMode;
      if (oldMode === "crop" || newMode === "erase" || oldMode === "remove-bg") {
        this.nowLoading = true;
      }
    },
    handleSizeChange(direction, value) {
      let widthValue = this.width;
      let heightValue = this.height;
      if (direction === "width") {
        widthValue = value;
      } else {
        heightValue = value;
      }
      if (this.imageStudio) {
        this.imageStudio.setWidthAndHeight(widthValue, heightValue, direction);
      }
    },
  },
};
</script>
<style scoped>
body {
  margin: 0;
  padding: 0;
}
.container {
  width: 100%;
  height: 100%;
  padding: 60px 40px;
  box-sizing: border-box;
  overflow: hidden;
}
.export-img-box {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 46px;
  box-sizing: border-box;
  z-index: 3;
  display: flex;
  justify-content: center;
  align-items: center;
}
.export-img-box img {
  width: auto;
  height: auto;
  max-width: 80%;
  max-height: 80%;
}
</style>
