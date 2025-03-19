<template>
  <div>
    <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" :style="canvasRenderStyle"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import bgImg from './bg1.jpg'

const canvas = ref<HTMLCanvasElement | null>(null);

const canvasWidth = ref(1500);
const canvasHeight = ref(1000);

const canvasStyle = ref({
  width: canvasWidth.value,
  height: canvasHeight.value
});

const canvasRenderStyle = computed(() => {
  return {
    width: `${canvasStyle.value.width / 2}px`,
    height: `${canvasStyle.value.height / 2}px`
  }
});

onMounted(() => {
  const img = new Image();
  img.src = bgImg;
  img.onload = () => {
    const ctx = canvas.value!.getContext("2d");
    if (ctx) {
      ctx.drawImage(
        img,
        0,
        0,
        3000,
        2000,
        0,
        0,
        canvasWidth.value,
        canvasHeight.value
      );
    }
  }
})

function drawCanvas () {

}

</script>

<style>
* {
  margin: 0;
  padding: 0;
}
</style>