# PixPro AI图片处理库（AI Image Processing Library）

PixPro 是一个图片处理工具，提供了图片处理的基础功能，如常用的裁剪、等比例缩放、翻转、镜像、旋转等功能。同时，PixPro 还嵌入了各类第三方的AI图像处理能力，例如AI 扩图、AI擦除、AI去背景、AI提升解析度（更多陆续更新..）

您可以在任意网页端快速嵌入该工具【任意图片上传框、表单、后台等等】，即可实现无缝AI图像处理体验。

详见 [Github 文档](https://github.com/lambortao/PixPro)。

## 安装

```bash
npm install @pixpro/vue2
```

## 使用方法
```vue
<template>
  <div class="editor-container">
    <pix-pro-vue v-bind="pixProAttrs" @handle-close="togglePixProVisible(false)" @handle-export-image="handleExportImage" />
  </div>
</template>

<script>
import { PixProVue } from '@pixpro/vue'
import '@pixpro/vue/dist/index.css'

export default {
  name: "UploadBox",
  components: {
    PixProVue,
  },
  data() {
    return {
      pixProVisible: false,
      imageSrc: "",
      fileInput: null,
      pixProAttrs: {
        cropRatios: {
          original: 0,
          "1:1": 1,
          "3:4": 3 / 4,
          "4:3": 4 / 3,
          "9:16": 9 / 16,
          "16:9": 16 / 9,
        },
        host: "",
        routes: "",
        token: "",
        fitstImage: null,
        showDownloadBtn: true,
        eraserSize: {
          min: 20,
          max: 100,
          default: 50,
        },
      },
    };
  },
  mounted() {
    this.fileInput = this.$refs.fileInput;
  },
  methods: {
    togglePixProVisible(visible) {
    },
    handleExportImage(image) {
    },
    closeImageSrc() {
    },
    handleDownload() {
    },
    triggerFileInput() {
    },
    handleFileChange(event) {
    },
  },
};
</script>

<style>
.editor-container {
  width: 100%;
  height: 600px;
}
</style>
```
