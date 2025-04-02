<!-- pixpro-vue 的入口文件 -->
<template>
  <pix-pro-skin
    v-model:width="width"
    v-model:height="height"
    v-model:img-current-width="imgCurrentWidth"
    v-model:img-current-height="imgCurrentHeight"
    v-model:loading="nowLoading"
    v-model:eraser-default-size="defaultEraserSize"
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
    <img :src="imageSrc" alt="">
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, watch } from 'vue';
import PixProSkin from './PixProSkin/index.vue';

/** 开发包的测试 */
import PhotoStudio, { type ICropRatio, type IDrawCanvasInfo, type IImageMode } from '../../../src/index';

/** 远程包的测试 */
// import PhotoStudio, { type ICropRatio, type IDrawCanvasInfo, type IImageMode } from '@pixpro/core';

const photoStudioContainer = ref<HTMLElement | null>(null);

const imageStudio = ref<PhotoStudio | null>(null);

const nowLoading = ref(false);

const props = defineProps<{
  /** 用户 token */
  token: string
  /** 请求 host */
  host: string
  /** 裁剪比例 */
  cropRatios?: Record<string, number>
  /** 初始图片 */
  fitstImage?: File | null
  /** 开启下载按钮 */
  showDownloadBtn?: boolean
  /** 请求 routes */
  routes?: string
  /** 橡皮擦大小 */
  eraserSize?: {
    min: number
    max: number
    default: number
  }
}>()

const emits = defineEmits<{
  (e: 'handle-close'): void
  (e: 'handle-export-image', image: string): void
}>()

/** 是否进入操作状态 */
const isOperate = ref(false);

const nowStep = ref<IDrawCanvasInfo | null>(null);

const nowStepList = ref<IDrawCanvasInfo[]>([]);
const realTimeStep = ref<IDrawCanvasInfo | null>(null);
const nowStepIndex = ref(-1);
const width = ref(0);
const height = ref(0);

/** 图片的原图宽高 */
const imgCurrentWidth = ref(0);
const imgCurrentHeight = ref(0);

const direction = ref<'vertical' | 'horizontal' | null>(null);

const cropRatio = ref<ICropRatio | null>(null);

const aiLoading = ref(false);
const disabledForm = ref(false);
const buttonLoading = ref(false);

const nowMode = ref<string>('crop');


/**
 * 获取实时的宽高
 */
 function getWH(step: IDrawCanvasInfo) {
  const wMultiplied = step.currentDomWidth / step.cropBoxWidth
  const hMultiplied = step.currentDomHeight / step.cropBoxHeight
  return {
    currentWidth: Math.round(step.rawImgWidth / (wMultiplied ?? 1)),
    currentHeight: Math.round(step.rawImgHeight / (hMultiplied ?? 1))
  }
}

const eraserSize = ref(props.eraserSize ?? {
  min: 20,
  max: 100,
  default: 50
})

const defaultEraserSize = ref(eraserSize.value.default)


/** 是否已经初始化 */
const isInit = ref(false);
/** 初始化 */
function initImageStudio() {
  imageStudio.value = new PhotoStudio(photoStudioContainer.value!, {
    token: props.token,
    merchantId: '',
    isDev: false,
    host: props.host,
    routes: props.routes ?? '/image/processing',
    eraserSize: eraserSize.value,
    action: {
      extend: 'ImageExpansion',
      erase: 'LocalizedImageRemoval',
      removeBg: 'BackgroundRemoval',
      hd: 'EnhanceImageResolution'
    },
    realTimeChange: (step: IDrawCanvasInfo) => {
      /** 实时计算宽高 */
      const { currentWidth, currentHeight } = getWH(step);
      width.value = currentWidth;
      height.value = currentHeight;
      realTimeStep.value = step;
      disabledForm.value = step.disabledForm ?? false;
      imgCurrentWidth.value = step.currentDomWidth / (step.cdProportions ?? 1);
      imgCurrentHeight.value = step.currentDomHeight / (step.cdProportions ?? 1);
    },
    onStepChange: ({ stepList, currentStepIndex }: { stepList: IDrawCanvasInfo[], currentStepIndex: number }) => {
      const step = stepList[currentStepIndex];
      realTimeStep.value = step;
      nowStepList.value = stepList;
      nowStepIndex.value = currentStepIndex;
      nowStep.value = step;
      direction.value = step.direction ?? 'vertical';
      // cropRatio.value = step.cropRatio ?? 'none';
      const { currentWidth, currentHeight } = getWH(step);
      width.value = currentWidth;
      height.value = currentHeight;
      imgCurrentWidth.value = step.currentDomWidth / (step.cdProportions ?? 1);
      imgCurrentHeight.value = step.currentDomHeight / (step.cdProportions ?? 1);
      nextTick(() => {
        aiLoading.value = false;
        nowLoading.value = false;
        disabledForm.value = step.disabledForm ?? false;
      })
    },
    onExportImage: (image: string) => {
      imageSrc.value = image;
      emits('handle-export-image', image)
      close()
    },
    onFinish: () => {
      aiLoading.value = false;
      nowLoading.value = false;
      if (!isInit.value) {
        isInit.value = true;
        triggerCropRatio()
      }
    },
    onUpload: () => {
      nowLoading.value = true;
      isOperate.value = true;
    },
    onEraserSizeChange: (size: number) => {
      eraserSize.value.default = size;
      defaultEraserSize.value = size;
    }
  });
}

/**
 * 触发比例裁剪，在 mounted 的时候自动触发，如果发现当前只传了一组比例数据则自动调用 handleCropRatio 方法，否则忽略
 */
function triggerCropRatio() {
  if (props.cropRatios && Object.keys(props.cropRatios).length === 1) {
    const ratio = props.cropRatios[Object.keys(props.cropRatios)[0]];
    console.log('触发比例裁剪', ratio, Object.keys(props.cropRatios)[0])
    handleCropRatio({ ratio, label: Object.keys(props.cropRatios)[0], isTrigger: false })
  }
}


onMounted(() => {
  initImageStudio()
  nextTick(() => {
    if (props.fitstImage) {
      imageStudio.value?.uploadFile(props.fitstImage)
    }
  })
});

const imageSrc = ref('');

const handleSizeChange = (direction: 'width' | 'height') => {
  imageStudio.value?.setWidthAndHeight(width.value, height.value, direction);
}

/** 关闭 */
const close = () => {
  /** 重置所有状态 */
  imageStudio.value?.resetAll()
  imageStudio.value = null
  /** 关闭弹窗 */
  emits('handle-close')
}

const exportImage = () => {
  imageStudio.value?.exportImage()
};

const rotate = (angle: number) => {
  imageStudio.value?.rotate(angle);
};

const rollback = () => {
  imageStudio.value?.rollback();
};

const forward = () => {
  imageStudio.value?.forward();
};

const reset = () => {
  imageStudio.value?.reset();
};

const flip = (direction: 'x' | 'y') => {
  imageStudio.value?.flip(direction);
};

const handleCropRatio = (ratio: { ratio: number | null, label: string, isTrigger?: boolean }) => {
  imageStudio.value?.cropRatio(ratio);
};

const turn = (direction: 'left' | 'right') => {
  imageStudio.value?.turn(direction);
};

const handleRotate = (angle: number) => {
  rotate(Number(angle));
};

/** 扩图 API */
const expandImageBtn = () => {
  aiLoading.value = true;
  imageStudio.value?.expandImageBtn();
};

const eraseImage = () => {
  aiLoading.value = true;
  imageStudio.value?.eraseImage();
};

const setEraserSize = (size: number) => {
  imageStudio.value?.setEraserSize(size);
};

const handleRemoveBg = () => {
  aiLoading.value = true;
  imageStudio.value?.removeBg();
};

const handleColorChange = (color: string) => {
  imageStudio.value?.setRemoveBgColor(color);
}

const handleHd = () => {
  aiLoading.value = true;
  imageStudio.value?.hd();
};

const handleDownloadImage = async () => {
  buttonLoading.value = true;
  await imageStudio.value?.downloadImage();
  buttonLoading.value = false;
}

const switchMode = ({ oldMode, newMode }: { oldMode: string, newMode: string }) => {
  if (oldMode === newMode) return
  console.log('切换模式', oldMode, newMode)
  nowMode.value = newMode
  imageStudio.value?.switchMode(oldMode as IImageMode, newMode as IImageMode);
  nowLoading.value = true;
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
