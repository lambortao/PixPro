<template>
  <i class="svg-icon" :style="{ fontSize: `${size}px` }" v-html="svgContent"></i>
</template>

<script>
export default {
  props: {
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 12,
    },
    color: {
      type: String,
      default: undefined,
    },
  },
  data() {
    return {
      svgContent: "",
    };
  },
  watch: {
    color() {
      this.loadSvg();
    },
  },
  mounted() {
    this.loadSvg();
  },
  methods: {
    async loadSvg() {
      try {
        const svg = await import(`../assets/icon/${this.name}.svg?raw`);

        const svgText = await svg.default;

        if (this.color) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgText, "image/svg+xml");
          const paths = doc.querySelectorAll("path, circle, rect, ellipse, line, polygon, polyline");

          paths.forEach((path) => {
            if (path.hasAttribute("stroke") && path.getAttribute("stroke") !== "none") {
              path.setAttribute("stroke", this.color);
            }
            if (path.hasAttribute("fill") && path.getAttribute("fill") !== "none") {
              path.setAttribute("fill", this.color);
            }
          });

          this.svgContent = new XMLSerializer().serializeToString(doc.documentElement);
        } else {
          this.svgContent = svgText;
        }
      } catch (error) {
        console.error(`Failed to load SVG: ${this.name}`, error);
      }
    },
  },
};
</script>

<style lang="less" scoped>
.svg-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
