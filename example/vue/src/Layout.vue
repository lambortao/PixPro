<template>
  <h1>图片编辑器功能</h1>
  <div class="photo-studio-container">
    <div class="upload-container">
      <div class="upload-container-input">
        <input type="file" name="file" id="file" accept=".png,.jpg,.jpeg" />
        <div>
          <span><svg focusable="false" data-icon="inbox" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="0 0 1024 1024"><path d="M885.2 446.3l-.2-.8-112.2-285.1c-5-16.1-19.9-27.2-36.8-27.2H281.2c-17 0-32.1 11.3-36.9 27.6L139.4 443l-.3.7-.2.8c-1.3 4.9-1.7 9.9-1 14.8-.1 1.6-.2 3.2-.2 4.8V830a60.9 60.9 0 0060.8 60.8h627.2c33.5 0 60.8-27.3 60.9-60.8V464.1c0-1.3 0-2.6-.1-3.7.4-4.9 0-9.6-1.3-14.1zm-295.8-43l-.3 15.7c-.8 44.9-31.8 75.1-77.1 75.1-22.1 0-41.1-7.1-54.8-20.6S436 441.2 435.6 419l-.3-15.7H229.5L309 210h399.2l81.7 193.3H589.4zm-375 76.8h157.3c24.3 57.1 76 90.8 140.4 90.8 33.7 0 65-9.4 90.3-27.2 22.2-15.6 39.5-37.4 50.7-63.6h156.5V814H214.4V480.1z"></path></svg></span>
          <p>点击上传图片或者将图片拖入虚线框内</p>
        </div>
      </div>
    </div>
    <div class="preview-control-container hide">
      <div class="preview-container">
        <canvas id="container-canvas"></canvas>
      </div>
      <div class="control-container">
        <span class="tl"></span><span class="tc inline"></span><span class="tr"></span>
        <span class="ml inline"></span><span class="mr inline"></span>
        <span class="bl"></span><span class="bc inline"></span><span class="br"></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

onMounted(() => {
  canvas.value = document.getElementById('container-canvas') as HTMLCanvasElement;
  ctx.value = canvas.value.getContext('2d');
  ctx.value.fillStyle = 'red';
  ctx.value.fillRect(0, 0, canvas.value.width, canvas.value.height);
});
</script>
<style scoped>
.photo-studio-container {
  box-sizing: border-box;
  min-height: 500px;
  padding: 16px;
}
.upload-container {
  box-sizing: border-box;
  box-shadow: 0 2px 5px 0 rgba(22,45,61,.12),0 0 7px 0 rgba(22,45,61,.12);
  border-radius: 6px;
  margin: 20px auto;
  width: 100%;
  min-height: inherit;
  border-radius: 6px;
  display: flex;
}
.upload-container-input {
  box-sizing: border-box;
  position: relative;
  border: 1px dashed #e0e0e0;
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.upload-container-input > div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.upload-container-input input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
  text-align: center;
}
.upload-container-input svg {
  font-size: 40px;
  color: #909399;
}
.upload-container-input p {
  margin-top: 10px;
  font-size: 14px;
  color: #909399;
}
.preview-control-container {
  position: relative;
  box-sizing: border-box;
  min-height: inherit;
  margin: 30px 80px;
  border: 1px dashed #e0e0e0;
}
.preview-container canvas {
  width: 100%;
  height: 100%;
}
.control-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid #e0e0e0;
  z-index: 1;
}
.control-container span {
  width: 15px;
  height: 15px;
  position: absolute;
}
span.tl {
  border-left: 4px solid #308ddd;
  border-top: 4px solid #308ddd;
  left: -4px;
  top: -4px;
  cursor: nw-resize;
}
span.tc {
  border-top: 4px solid #308ddd;
  left: calc(50% - 7.5px);
  top: -4px;
  cursor: n-resize;
}
span.tr {
  border-right: 4px solid #308ddd;
  border-top: 4px solid #308ddd;
  right: -4px;
  top: -4px;
  cursor: ne-resize;
}
span.ml {
  border-left: 4px solid #308ddd;
  left: -4px;
  top: calc(50% - 7.5px);
  cursor: w-resize;
}
span.mr {
  border-right: 4px solid #308ddd;
  right: -4px;
  top: calc(50% - 7.5px);
  cursor: e-resize;
}
span.bl {
  border-left: 4px solid #308ddd;
  border-bottom: 4px solid #308ddd;
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}
span.bc {
  border-bottom: 4px solid #308ddd;
  bottom: -4px;
  left: calc(50% - 7.5px);
  cursor: s-resize;
}
span.br {
  border-right: 4px solid #308ddd;
  border-bottom: 4px solid #308ddd;
  right: -4px;
  bottom: -4px;
  cursor: se-resize;
}
span.inline {
  width: 24px;
  height: 24px;
}
.show {
  display: block;
}
.hide {
  display: none;
}
</style>
