<!-- 该文件为组件承载页面，不计入插件内 -->

<template>
  <div class="upload-box">
    <div class="upload-container">
      <input 
        type="file" 
        ref="fileInput"
        accept="image/*"
        @change="handleFileChange"
        class="file-input"
        style="display: none"
      />
      <button
        @click="triggerFileInput"
        class="upload-button"
      >
        点击上传图片
      </button>
    </div>
  </div>
  
  <transition name="fade">
    <div v-if="pixProVisible" class="pix-pro-box">
      <pix-pro-vue
        v-bind="pixProAttrs"
        @handle-close="togglePixProVisible(false)"
        @handle-export-image="handleExportImage"
      />
    </div>
  </transition>
  <div v-if="imageSrc" class="export-img-box">
    <img :src="imageSrc" alt="">
    <div class="buttons-container">
      <div class="action-btn download-btn" @click="handleDownload">
        <button>下载</button>
      </div>
      <div class="action-btn close-btn" @click="closeImageSrc">
        <button>关闭</button>
      </div>
    </div>
  </div>
</template>
  
<script setup lang='ts'>
// import PixProVue from './PixProVue.vue';
// import PixProVue from '../../../packages/pixpro-vue/src/components/PixProVue.vue';
import { PixProVue } from '@pixpro/vue';
import '@pixpro/vue/dist/index.css'
import { computed, ref } from 'vue';

const pixProAttrs = computed(() => ({
  cropRatios: {
    original: 0,
    '1:1': 1,
    '3:4': 3 / 4,
    '4:3': 4 / 3,
    '9:16': 9 / 16,
    '16:9': 16 / 9
  },
  host: import.meta.env.VITE_HOST,
  routes: import.meta.env.VITE_ROUTES,
  token: import.meta.env.VITE_TOKEN,
  fitstImage: null as File | null,
  showDownloadBtn: true,
  eraserSize: {
    min: 20,
    max: 100,
    default: 50
  }
}))


const pixProVisible = ref(false);

function togglePixProVisible(visible?: boolean) {
  pixProVisible.value = visible ?? !pixProVisible.value;
}

const imageSrc = ref('');
function handleExportImage(image: string) {
  imageSrc.value = image;
}
function closeImageSrc () {
  imageSrc.value = '';
}

function handleDownload() {
  if (!imageSrc.value) return;
  
  const link = document.createElement('a');
  link.href = imageSrc.value;
  link.download = 'pixpro-image.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    if (file.type.startsWith('image/')) {
      togglePixProVisible()
      pixProAttrs.value.fitstImage = file;
      target.value = '';
    } else {
      alert('请选择图片文件');
    }
  }
}

</script>
  
<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.upload-container {
  padding: 20px;
}

.upload-button {
  padding: 12px 24px;
  font-size: 16px;
  cursor: pointer;
}

.upload-button .el-icon {
  margin-right: 8px;
}

.export-img-box {
  max-width: 80vw;
  max-height: 80vw;
  margin: 20px auto;
  overflow: hidden;
}

.export-img-box img {
  max-width: 100%;
  max-height: 100%;
}

.buttons-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.buttons-container .action-btn {
  margin: 0 10px;
}

</style>
