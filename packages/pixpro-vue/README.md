# PixPro AI图片处理库（AI Image Processing Library）

PixPro 是一个图片处理工具，提供了图片处理的基础功能，如常用的裁剪、等比例缩放、翻转、镜像、旋转等功能。同时，PixPro 还嵌入了各类第三方的AI图像处理能力，例如AI 扩图、AI擦除、AI去背景、AI提升解析度（更多陆续更新..）

您可以在任意网页端快速嵌入该工具【任意图片上传框、表单、后台等等】，即可实现无缝AI图像处理体验。

详见 [Github 文档](https://github.com/lambortao/PixPro)。

## 安装

```bash
npm install @pixpro/vue
```

## 使用方法
```vue
<template>
  <div class="editor-container">
    <pix-pro-vue
      :token="token"
      :merchant-id="merchantId"
      :host="host"
      @export-image="handleExportImage"
      @close="handleClose"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PixProVue } from '@pixpro/vue'
import '@pixpro/vue/dist/index.css'

const token = 'your_token'
const merchantId = 'your_merchant_id'
const host = 'https://api.example.com'

const handleExportImage = (imageData: string) => {
  console.log('导出的图片数据:', imageData)
}

const handleClose = () => {
  console.log('编辑器关闭')
}
</script>

<style>
.editor-container {
  width: 100%;
  height: 600px;
}
</style>
```
