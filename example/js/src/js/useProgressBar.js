// useProgressBar.js
function useProgressBar(loading) {
  // 控制进度条显示的状态
  let showProgressBar = {
    value: false,
  };

  // 控制进度条的进度
  let progress = 0;

  // 控制进度条的动画速度
  let fastFinish = false;

  // 获取进度条元素
  const progressBar = document.getElementById("progressBar");
  // 获取进度条百分比元素
  const progressPercentage = document.getElementById("progressPercentage");
  // 获取进度条填充元素
  const progressFill = document.getElementById("progressFill");
  // 全局遮罩
  const fullScreenBlocker = document.getElementById("fullScreenBlocker");

  // 模拟进度条进度
  function simulateProgress() {
    // 如果加载已结束且进度已达100%，隐藏进度条
    if (!loading.value && progress >= 100) {
      setTimeout(() => {
        showProgressBar.value = false;
      }, 150);
      return;
    }

    // 确定进度条的最大值
    const maxProgress = loading.value ? 95 : 100;

    // 确定增加的进度量
    let increment = 2;

    // 如果是快速完成模式，加快进度
    if (fastFinish) {
      increment = 10;
    }

    // 如果当前进度小于最大进度，继续增加进度
    if (progress < maxProgress) {
      // 如果正常加载中，且进度接近95%，减缓速度
      if (loading.value && progress > 85) {
        increment = 0.5;
      }

      progress = Math.min(progress + increment, maxProgress);

      if (progressPercentage) {
        progressPercentage.innerText = `${progress}%`;
      }
      if (progressFill) {
        progressFill.style.transform = `scaleX(${progress / 100})`;
      }
      console.log(progress, "-----------------progress-----------");

      // 计算下一次更新的延迟
      let delay = fastFinish ? 10 : 30;

      // 如果接近结束，放慢速度（如果不是快速完成模式）
      if (!fastFinish) {
        if (progress > 85 && progress < 95) {
          delay = 60;
        } else if (progress >= 95) {
          delay = 20;
        }
      }

      // 计划下一次更新
      setTimeout(simulateProgress, delay);
    } else if (!loading.value && progress >= 95 && progress < 100) {
      // 加载已结束，但进度条尚未达到100%，快速完成最后5%
      progress = 100;
      // 延迟一点以显示100%的状态
      setTimeout(() => {
        // 进度已达100%且加载已结束，隐藏进度条
        showProgressBar.value = false;
      }, 150);
    }
  }

  // 确保 loading 是一个对象
  if (typeof loading !== "object") {
    loading = { value: loading };
  }

  // 监听 loading 状态变化
  let originalValue = loading.value;
  Object.defineProperty(loading, "value", {
    set: function (newValue) {
      const oldValue = originalValue;
      originalValue = newValue;

      if (newValue) {
        // 加载开始，显示进度条，重置进度
        showProgressBar.value = true;
        progress = 0;
        fastFinish = false;

        // 开始进度条动画
        simulateProgress();
      } else if (oldValue) {
        // 加载结束，继续进度条动画，它会检测到 loading=false 并完成剩余的进度
        fastFinish = true;
        simulateProgress();
      }
    },
    get: function () {
      return originalValue;
    },
  });

  // 监听进度条是显示
  Object.defineProperty(showProgressBar, "value", {
    set: function (newValue) {
      if (newValue) {
        if (progressBar) {
          progressBar.style.display = "flex";
        }
        if (fullScreenBlocker) {
          fullScreenBlocker.style.display = "block";
        }
      } else {
        if (progressBar) {
          progressBar.style.display = "none";
        }
        if (fullScreenBlocker) {
          fullScreenBlocker.style.display = "none";
        }
      }
    },
    get: function () {
      return originalValue;
    },
  });
}

export default useProgressBar;
