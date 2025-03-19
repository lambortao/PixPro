<template>
  <div class="box" ref="photoStudioContainer">
    <div data-draggable="n" class="dots n" ref="dots"></div>
    <div data-draggable="s" class="dots s" ref="dots"></div>
  </div>

</template>

<script setup lang="ts">
import { onMounted, ref, type Ref } from 'vue';

const move = ref(false);

onMounted(() => {
  const box = document.querySelector('.box') as HTMLElement;
  const boxRect = box.getBoundingClientRect();

  let activeElement: HTMLElement | null = null;
  let nowDraggable: 'n' | 's' | null = null;

  const rafId: Ref<number | null> = ref(null);

  /** 开始移动的坐标 */
  let startX = 0;
  let startY = 0;

  /** 当前鼠标移动的距离 */
  let mouseLeft = 0;
  let mouseTop = 0;

  document.addEventListener('mousedown', (e) => {
    activeElement = e.target as HTMLElement;
    nowDraggable = activeElement.dataset.draggable as 'n' | 's';
    if (!nowDraggable) return;
    move.value = true;
    mouseLeft = e.clientX;
    mouseTop = e.clientY;
    console.log('boxRect', boxRect)

    /** 开始移动的坐标 */
    const rect = activeElement.getBoundingClientRect();
    startX = rect.left - boxRect.left;
    startY = rect.top - boxRect.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (move.value && activeElement && nowDraggable) {
      if (rafId.value) {
        cancelAnimationFrame(rafId.value);
      }
      rafId.value = requestAnimationFrame(() => {
        const nowRect = activeElement!.getBoundingClientRect();
        const moveX = e.clientX - mouseLeft;
        const moveY = e.clientY - mouseTop;
        const newLeft = moveX + startX;
        const newTop = moveY + startY;

        const clampedLeft = Math.max(0, Math.min(newLeft, boxRect.width - nowRect.width));
        const clampedTop = Math.max(0, Math.min(newTop, boxRect.height - nowRect.height));

        activeElement!.style.top = `${clampedTop}px`;
        activeElement!.style.left = `${clampedLeft}px`;
      });
    }
    e.preventDefault();
  });
  document.addEventListener('mouseup', (e) => {
    startX = activeElement?.style.left ? parseInt(activeElement.style.left) - boxRect.left : 0;
    startY = activeElement?.style.top ? parseInt(activeElement.style.top) - boxRect.top : 0;


    move.value = false;
    nowDraggable = null;
    activeElement = null;

    mouseLeft = 0;
    mouseTop = 0;

    e.preventDefault();
  });
});
</script>
<style>
body {
  margin: 0;
  padding: 0;
}

.box {
  width: 80vw;
  height: 60vh;
  background-color: #f0f0f0;
  margin: 30px auto;
  position: relative;
}

.dots {
  width: 20px;
  height: 20px;
  background-color: red;
  position: absolute;
  top: 30px;
  left: 30px;
}

.dots.n {
  top: 0;
}

.dots.s {
  left: 0;
}
</style>
