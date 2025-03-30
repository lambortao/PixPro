<template>
  <i
    class="svg-icon"
    :style="{ fontSize: `${size}px` }"
    v-html="svgContent"
  ></i>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
  name: string;
  size?: number;
  color?: string; // 可选的颜色属性
}

const props = withDefaults(defineProps<Props>(), {
  size: 12,
  color: undefined, // 默认不设置颜色
});

const svgContent = ref('');

// 动态加载 SVG 并设置颜色
const loadSvg = async () => {
  try {
    const svg = await import(`../assets/icon/${props.name}.svg?raw`);
    let svgText = svg.default;

    // 如果传入了 color，动态设置 fill 或 stroke
    if (props.color) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgText, 'image/svg+xml');
      const paths = doc.querySelectorAll('path, circle, rect, ellipse, line, polygon, polyline');

      paths.forEach((path) => {
        // 如果 path 有 stroke 属性，则设置 stroke
        if (path.hasAttribute('stroke') && path.getAttribute('stroke') !== 'none') {
          path.setAttribute('stroke', props.color!);
        }
        // 如果 path 有 fill 属性，则设置 fill
        if (path.hasAttribute('fill') && path.getAttribute('fill') !== 'none') {
          path.setAttribute('fill', props.color!);
        }
      });

      // 将修改后的 SVG 转换为字符串
      svgText = new XMLSerializer().serializeToString(doc.documentElement);
    }

    svgContent.value = svgText;
  } catch (error) {
    console.error(`Failed to load SVG: ${props.name}`, error);
  }
};

// 监听 props.color 变化
watch(() => props.color, loadSvg);

// 组件挂载时加载 SVG
onMounted(loadSvg);
</script>

<style lang="less" scoped>
.svg-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>