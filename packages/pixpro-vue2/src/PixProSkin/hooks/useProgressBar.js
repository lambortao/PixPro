export default {
  props: {
    loading: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      /** 控制进度条显示的状态 */
      showProgressBar: false,
      /** 控制进度条的进度 */
      progress: 0,
      /** 控制进度条的动画速度 */
      fastFinish: false,
    };
  },
  watch: {
    loading: {
      handler(newVal, oldVal) {
        if (newVal) {
          /** 加载开始，显示进度条，重置进度 */
          this.showProgressBar = true;
          this.progress = 0;
          this.fastFinish = false;

          /** 开始进度条动画 */
          this.simulateProgress();
        } else if (oldVal) {
          /** 加载结束，继续进度条动画，它会检测到 loading=false 并完成剩余的进度 */
          this.fastFinish = true;
          this.simulateProgress();
        }
      },
      immediate: true,
    },
  },
  methods: {
    /** 模拟进度条进度 */
    simulateProgress() {
      /** 如果加载已结束且进度已达100%，隐藏进度条 */
      if (!this.loading && this.progress >= 100) {
        /** 延迟150ms后隐藏进度条 */
        setTimeout(() => {
          this.showProgressBar = false;
        }, 150);
        return;
      }

      /** 确定进度条的最大值 */
      const maxProgress = this.loading ? 95 : 100;

      /** 确定增加的进度量 */
      let increment = 2;

      /** 如果是快速完成模式，加快进度 */
      if (this.fastFinish) {
        increment = 10;
      }

      /** 如果当前进度小于最大进度，继续增加进度 */
      if (this.progress < maxProgress) {
        /** 如果正常加载中，且进度接近95%，减缓速度 */
        if (this.loading && this.progress > 85) {
          /** 接近95%时减缓速度 */
          increment = 0.5;
        }

        this.progress = Math.min(this.progress + increment, maxProgress);

        /** 计算下一次更新的延迟 */
        let delay = this.fastFinish ? 10 : 30;

        /** 如果接近结束，放慢速度（如果不是快速完成模式） */
        if (!this.fastFinish) {
          if (this.progress > 85 && this.progress < 95) {
            delay = 60;
          } else if (this.progress >= 95) {
            delay = 20;
          }
        }

        /** 计划下一次更新 */
        setTimeout(this.simulateProgress, delay);
      } else if (!this.loading && this.progress >= 95 && this.progress < 100) {
        /** 加载已结束，但进度条尚未达到100%，快速完成最后5% */
        this.progress = 100;
        /** 延迟一点以显示100%的状态 */
        setTimeout(() => {
          /** 进度已达100%且加载已结束，隐藏进度条 */
          this.showProgressBar = false;
        }, 150);
      }
    },
  },
};
