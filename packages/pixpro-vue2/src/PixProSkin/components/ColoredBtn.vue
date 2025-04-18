<template>
  <button class="colored-btn" :class="{ loading, disabled }" :disabled="disabled || loading" @click="$emit('click')">
    <span class="btn-content">
      <svg-icon v-if="loading" name="loading" :size="16" />
      <span v-else>{{ text }}</span>
    </span>
  </button>
</template>

<script>
import SvgIcon from "./SvgIcon.vue";

export default {
  name: "ColoredBtn",
  components: {
    SvgIcon,
  },
  props: {
    text: {
      type: String,
      default: "按钮",
    },
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped lang="less">
@import "../assets/style/_constant.less";
button {
  margin: 20px auto;
  width: 128px;
  height: 36px;
  border-radius: @radius;
  border: none;
  color: #fff;
  background: linear-gradient(to right, #184aff 0%, #fc9bff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  .ani300;

  :deep(svg) {
    color: #fff;
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}
</style>
