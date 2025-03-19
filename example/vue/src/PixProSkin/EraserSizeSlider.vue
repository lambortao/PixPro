<script setup lang="ts">
const size = defineModel<number>('size', {
  type: Number,
  required: true,
  default: 20
})
</script>

<template>
  <div>
    <small>橡皮擦大小</small>
    <input
      type="range"
      :min="20"
      :max="100"
      v-model="size"
      :style="{ background: `linear-gradient(to right, #4878ef 0%, #4878ef ${(size - 20) / 80 * 100}%, #e0e0e0 ${(size - 20) / 80 * 100}%, #e0e0e0 100%)` }"
    />
  </div>
</template>

<style scoped>
small {
  display: block;
  margin: 20px 0 10px;
}

input {
  width: 100%;
  -webkit-appearance: none; /* Safari */
  appearance: none;
  height: 6px;
  border-radius: 3px;
  outline: none;
  opacity: 1;
  transition: opacity .2s;
}

input::-webkit-slider-thumb {
  -webkit-appearance: none; /* Safari */
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4878ef;
  cursor: pointer;
}

input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4878ef;
  cursor: pointer;
}
</style>