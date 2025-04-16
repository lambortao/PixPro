<template>
  <button @click="handleClick" :disabled="disabled || loading" :loading="loading">
    <svg-icon :name="icon" color="#fff" />
    <span>{{ text }}</span>
  </button>
</template>

<script>
import SvgIcon from "./SvgIcon.vue";

export default {
  components: {
    SvgIcon,
  },
  props: {
    text: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "expand-btn",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleClick() {
      this.$emit("click");
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
