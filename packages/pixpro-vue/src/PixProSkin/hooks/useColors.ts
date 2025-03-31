import { ref, computed, onMounted, type Ref, nextTick } from 'vue';
import { colorListData } from './config';


/**
 * 颜色管理
 * @param handleColorChange 修改颜色
 * @returns 颜色列表
 * 
 * 这里需要将新增的颜色记录到步骤中去吗？现在已经记录到本地存储里面去了，没必要再记录到步骤中去
 * 唯一会发生的问题，就是删除颜色后再回退，会出现色板上不存在的颜色，这个不是什么大问题，重新选择一下颜色就可以了
 */
export default (handleColorChange: (color: string) => void, currentColor: Ref<string>) => {
  const colorList = ref(colorListData)
  const colorBoxVisible = ref(false);

  const localColorList = ref<string[]>([])

  const allColorsList = computed(() => {
    return [...colorList.value, ...localColorList.value]
  })

  function getColorLocalStorage() {
    const colorList = localStorage.getItem('PIXPRO_COLOR_LIST');
    if (colorList) {
      localColorList.value = colorList.split(',');
    }
  }

  function setColorLocalStorage(colorList: string[]) {
    localStorage.setItem('PIXPRO_COLOR_LIST', colorList.join(','));
  }

  function removeLocalColorStorage(color: string) {
    const index = localColorList.value.indexOf(color);
    if (index !== -1) {
      localColorList.value.splice(index, 1);
      console.log(localColorList.value)
      setColorLocalStorage(localColorList.value);
      nextTick(() => {
        handleColorChange(currentColor.value);
      })
    }
  }

  function handleAddNewColor(color: string) {
    if (localColorList.value.includes(color)) {
      handleColorChange(color);
      colorBoxVisible.value = false;
      return;
    }
    localColorList.value.push(color);
    setColorLocalStorage(localColorList.value);
    handleColorChange(color);
    colorBoxVisible.value = false;
  }

  onMounted(() => {
    getColorLocalStorage();
  })

  return {
    colorList,
    colorBoxVisible,
    localColorList,
    allColorsList,
    getColorLocalStorage,
    setColorLocalStorage,
    removeLocalColorStorage,
    handleAddNewColor
  }
}