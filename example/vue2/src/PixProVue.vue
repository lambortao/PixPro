<!-- pixpro-vue 的入口文件 -->
<template>
    <div class="box">
        <pix-pro-skin :width="width" @update:width="(val) => (width = val)" :height="height" @update:height="(val) => (height = val)" :img-current-width="imgCurrentWidth" @update:img-current-width="(val) => (imgCurrentWidth = val)" :img-current-height="imgCurrentHeight" @update:img-current-height="(val) => (imgCurrentHeight = val)" :loading="nowLoading" @update:loading="(val) => (nowLoading = val)" :eraser-default-size="defaultEraserSize" @update:eraser-default-size="(val) => (defaultEraserSize = val)" :crop-ratios="cropRatios" :step-index="nowStepIndex" :step-list="nowStepList" :real-time-step="realTimeStep" :aiLoading="aiLoading" :button-loading="buttonLoading" :show-download-btn="showDownloadBtn" :disabled-form="disabledForm" :is-operate="isOperate" :eraser-size="eraserSize" :now-mode="nowMode" @rollback="rollback" @forward="forward" @reset="reset" @flip="flip" @crop-ratio="handleCropRatio" @turn="turn" @rotate="handleRotate" @color-change="handleColorChange" @export-image="exportImage" @expand-image-btn="expandImageBtn" @erase-image="eraseImage" @set-eraser-size="setEraserSize" @remove-bg="handleRemoveBg" @switch-mode="switchMode" @hd="handleHd" @handle-close="close" @handle-download-image="handleDownloadImage" @handleSizeChange="handleSizeChange">
            <div class="container" ref="photoStudioContainer" />
        </pix-pro-skin>
        <div v-if="imageSrc" @click="imageSrc = ''" class="export-img-box">
            <img :src="imageSrc" alt="" />
        </div>
    </div>
</template>

<script>
import { nextTick } from "vue";
import PixProSkin from "./PixProSkin/index.vue";
import PhotoStudio from "@pixpro/core";

export default {
    name: "PixProVue",
    components: {
        PixProSkin,
    },
    props: {
        token: {
            type: String,
        },
        host: {
            type: String,
        },
        cropRatios: {
            type: Object,
            default: () => null,
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
            default: "",
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
            defaultEraserSize: this.eraserSize.default,
            isInit: false,
            imageSrc: "",
        };
    },
    mounted() {
        this.initImageStudio();
        nextTick(() => {
            if (this.fitstImage) {
                this.imageStudio?.uploadFile(this.fitstImage);
            }
        });
    },
    methods: {
        getWH(step) {
            const wMultiplied = step.currentDomWidth / step.cropBoxWidth;
            const hMultiplied = step.currentDomHeight / step.cropBoxHeight;
            return {
                currentWidth: Math.round(step.rawImgWidth / (wMultiplied ?? 1)),
                currentHeight: Math.round(step.rawImgHeight / (hMultiplied ?? 1)),
            };
        },
        initImageStudio() {
            this.imageStudio = new PhotoStudio(this.$refs.photoStudioContainer, {
                token: this.token,
                merchantId: "",
                isDev: false,
                host: this.host,
                routes: this.routes || "/image/processing",
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
                    nextTick(() => {
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
                    this.nowLoading = true;
                    this.isOperate = true;
                },
                onEraserSizeChange: (size) => {
                    this.eraserSize.default = size;
                    this.defaultEraserSize = size;
                },
            });
        },
        triggerCropRatio() {
            if (this.cropRatios && Object.keys(this.cropRatios).length === 1) {
                const ratio = this.cropRatios[Object.keys(this.cropRatios)[0]];
                console.log("触发比例裁剪", ratio, Object.keys(this.cropRatios)[0]);
                this.handleCropRatio({ ratio, label: Object.keys(this.cropRatios)[0], isTrigger: false });
            }
        },
        handleSizeChange(direction) {
            this.imageStudio?.setWidthAndHeight(this.width, this.height, direction);
        },
        close() {
            this.imageStudio?.resetAll();
            this.imageStudio = null;
            this.$emit("handle-close");
        },
        exportImage() {
            this.imageStudio?.exportImage();
        },
        rotate(angle) {
            this.imageStudio?.rotate(angle);
        },
        rollback() {
            this.imageStudio?.rollback();
        },
        forward() {
            this.imageStudio?.forward();
        },
        reset() {
            this.imageStudio?.reset();
        },
        flip(direction) {
            this.imageStudio?.flip(direction);
        },
        handleCropRatio(ratio) {
            this.imageStudio?.cropRatio(ratio);
        },
        turn(direction) {
            this.imageStudio?.turn(direction);
        },
        handleRotate(angle) {
            this.rotate(Number(angle));
        },
        expandImageBtn() {
            this.aiLoading = true;
            this.imageStudio?.expandImageBtn();
        },
        eraseImage() {
            this.aiLoading = true;
            this.imageStudio?.eraseImage();
        },
        setEraserSize(size) {
            this.imageStudio?.setEraserSize(size);
        },
        handleRemoveBg() {
            this.aiLoading = true;
            this.imageStudio?.removeBg();
        },
        handleColorChange(color) {
            this.imageStudio?.setRemoveBgColor(color);
        },
        handleHd() {
            this.aiLoading = true;
            this.imageStudio?.hd();
        },
        async handleDownloadImage() {
            this.buttonLoading = true;
            await this.imageStudio?.downloadImage();
            this.buttonLoading = false;
        },
        switchMode({ oldMode, newMode }) {
            if (oldMode === newMode) return;
            console.log("切换模式", oldMode, newMode);
            this.nowMode = newMode;
            this.imageStudio?.switchMode(oldMode, newMode);
            this.nowLoading = true;
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
