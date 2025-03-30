<template>
  <button
    @click="handleClick"
    :disabled="disabled || loading"
    :loading="loading"
  >
    <svg-icon :name="icon" color="#fff" />
    <span>{{ text }}</span>
  </button>
</template>
  
<script setup lang='ts'>
import SvgIcon from './SvgIcon.vue'

const {
  text,
  icon = 'expand-btn',
  disabled = false,
  loading = false
} = defineProps<{
  text: string
  icon?: string
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click')
}
</script>
  
<style scoped lang='less'>
@import '../assets/style/_constant.less';
button {
  margin: 20px auto;
  width: 128px;
  height: 36px;
  border-radius: @radius;
  border: none;
  color: #fff;
  background: linear-gradient(to right, #184AFF 0%, #FC9BFF 100%);
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