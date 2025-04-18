<template>
  <div class="upload-box">
    <div class="upload-container">
      <input type="file" ref="fileInput" accept="image/*" @change="handleFileChange" class="file-input" style="display: none" />
      <button @click="triggerFileInput" class="upload-button">点击上传图片</button>
    </div>

    <transition name="fade">
      <div v-if="pixProVisible" class="pix-pro-box">
        <pix-pro-vue v-bind="pixProAttrs" @handle-close="togglePixProVisible(false)" @handle-export-image="handleExportImage" />
      </div>
    </transition>
    <div v-if="imageSrc" class="export-img-box">
      <img :src="imageSrc" alt="" />
      <div class="buttons-container">
        <div class="action-btn download-btn" @click="handleDownload">
          <button>下载</button>
        </div>
        <div class="action-btn close-btn" @click="closeImageSrc">
          <button>关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/** 当前目录的测试 */
import PixProVue from "./PixProVue.vue";

/** 远程包的测试 */
// import { PixProVue } from '@pixpro/vue';
// import '@pixpro/vue/dist/index.css'

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
      this.pixProVisible = visible !== undefined ? visible : !this.pixProVisible;
    },
    handleExportImage(image) {
      this.imageSrc = image;
    },
    closeImageSrc() {
      this.imageSrc = "";
    },
    handleDownload() {
      if (!this.imageSrc) return;

      const link = document.createElement("a");
      link.href = this.imageSrc;
      link.download = "pixpro-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    triggerFileInput() {
      this.fileInput.click();
    },
    handleFileChange(event) {
      const target = event.target;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        if (file.type.startsWith("image/")) {
          this.togglePixProVisible(true);
          this.pixProAttrs.fitstImage = file;
          target.value = "";
        } else {
          alert("请选择图片文件");
        }
      }
    },
  },
};
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
