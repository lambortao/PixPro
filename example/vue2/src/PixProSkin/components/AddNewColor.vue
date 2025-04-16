<template>
  <div class="color-item add-btn">
    <span @click="toggleColorBox">
      <svg-icon name="add" />
    </span>
    <div class="color-select" v-show="colorBoxVisible">
      <p>点击色块选择颜色</p>
      <input type="color" ref="inputRef" />
      <footer>
        <button @click="handleConfirm" class="toolbar-btn primary">确认</button>
        <button @click="handleCancel" class="toolbar-btn">取消</button>
      </footer>
    </div>
  </div>
</template>

<script>
import SvgIcon from "./SvgIcon.vue";

export default {
  components: {
    SvgIcon,
  },
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      colorBoxVisible: this.visible,
    };
  },
  watch: {
    visible(newVal) {
      this.colorBoxVisible = newVal;
    },
    colorBoxVisible(newVal) {
      this.$emit("update:visible", newVal);
    },
  },
  methods: {
    toggleColorBox() {
      this.colorBoxVisible = !this.colorBoxVisible;
    },
    handleConfirm() {
      const color = this.$refs.inputRef.value;
      this.$emit("confirm", color);
      this.colorBoxVisible = false;
    },
    handleCancel() {
      this.colorBoxVisible = false;
    },
  },
};
</script>

<style lang="less" scoped>
@import "../assets/style/index.less";

.color-item {
  position: relative;
  overflow: visible !important;
  z-index: 9;
}
span {
  box-sizing: border-box;
  border: 1px solid #cdd5dd;
  width: 100%;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(to bottom, #f9f9f9, #ffffff);
}
.color-select {
  box-sizing: border-box;
  padding: 10px;
  border-radius: 8px;
  position: absolute;
  width: 180px;
  top: 0px;
  left: 50px;
  cursor: auto;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
  background-color: #fff;
}
input {
  cursor: pointer;
  width: 100%;
}
p {
  font-size: 12px;
  color: #666;
  margin: 0 0 5px;
  text-align: center;
}

footer {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  .toolbar-btn {
    width: 100%;
    padding: 5px 10px !important;
    margin-top: 10px !important;
  }
}
</style>
