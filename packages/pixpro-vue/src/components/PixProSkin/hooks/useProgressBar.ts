import { ref, type Ref, watch } from 'vue';

export default (loading: Ref<boolean | undefined>) => {
  /** 控制进度条显示的状态 */
  const showProgressBar = ref(false);
  /** 控制进度条的进度 */
  const progress = ref(0);
  /** 控制进度条的动画速度 */
  const fastFinish = ref(false);

  /** 模拟进度条进度 */
  function simulateProgress() {
    /** 如果加载已结束且进度已达100%，隐藏进度条 */
    if (!loading.value && progress.value >= 100) {
      /** 延迟150ms后隐藏进度条 */
      setTimeout(() => {
        showProgressBar.value = false;
      }, 150);
      return;
    }

    /** 确定进度条的最大值 */
    const maxProgress = loading.value ? 95 : 100;
    
    /** 确定增加的进度量 */
    let increment = 2;
    
    /** 如果是快速完成模式，加快进度 */
    if (fastFinish.value) {
      increment = 10;
    }
    
    /** 如果当前进度小于最大进度，继续增加进度 */
    if (progress.value < maxProgress) {
      /** 如果正常加载中，且进度接近95%，减缓速度 */
      if (loading.value && progress.value > 85) {
        /** 接近95%时减缓速度 */
        increment = 0.5;
      }
      
      progress.value = Math.min(progress.value + increment, maxProgress);
      
      /** 计算下一次更新的延迟 */
      let delay = fastFinish.value ? 10 : 30;
      
      /** 如果接近结束，放慢速度（如果不是快速完成模式） */
      if (!fastFinish.value) {
        if (progress.value > 85 && progress.value < 95) {
          delay = 60;
        } else if (progress.value >= 95) {
          delay = 20;
        }
      }
      
      /** 计划下一次更新 */
      setTimeout(simulateProgress, delay);
    } else if (!loading.value && progress.value >= 95 && progress.value < 100) {
      /** 加载已结束，但进度条尚未达到100%，快速完成最后5% */
      progress.value = 100;
      /** 延迟一点以显示100%的状态 */
      setTimeout(() => {
        /** 进度已达100%且加载已结束，隐藏进度条 */
        showProgressBar.value = false;
      }, 150);
    }
  }

  // 监听 loading 状态变化
  watch(loading, (newVal, oldVal) => {
    if (newVal) {
      /** 加载开始，显示进度条，重置进度 */
      showProgressBar.value = true;
      progress.value = 0;
      fastFinish.value = false;
      
      /** 开始进度条动画 */
      simulateProgress();
    } else if (oldVal) {
      /** 加载结束，继续进度条动画，它会检测到 loading=false 并完成剩余的进度 */
      fastFinish.value = true;
      simulateProgress();
    }
  });

  return {
    showProgressBar,
    progress
  };
}