<template>
  <div class="color-item add-btn">
    <span @click="colorBoxVisible = true">
      <svg-icon name="add" />
    </span>
    <div class="color-select" v-show="colorBoxVisible">
      <p>点击色块选择颜色</p>
      <input type="color" ref="inputRef">
      <footer>
        <button @click="handleConfirm" class="toolbar-btn primary">确认</button>
        <button @click="colorBoxVisible = false" class="toolbar-btn">取消</button>
      </footer>
    </div>
  </div>
</template>
  
<script setup lang='ts'>
import { nextTick } from 'vue';
import SvgIcon from './SvgIcon.vue';
import { ref } from 'vue';

const colorBoxVisible = defineModel<boolean>('visible', { required: true });

const emit = defineEmits<{
  (e: 'confirm', color: string): void
}>();

/** 实例化 input 标签 */
const inputRef = ref<HTMLInputElement>();

/** 获取 input 标签的值 */
const getInputValue = () => {
  return inputRef.value?.value;
}

/** 处理确认 */
const handleConfirm = () => {
  emit('confirm', getInputValue());
  nextTick(() => {
    colorBoxVisible.value = false;
  })
}
</script>
  
<style lang="less" scoped>
@import '../assets/style/index.less';

.color-item {
  position: relative;
  overflow: visible !important;
  z-index: 9;
}
span {
  box-sizing: border-box;
  border: 1px solid #CDD5DD;
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