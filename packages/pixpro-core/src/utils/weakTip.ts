interface WeakTipOptions {
  /** 提示文案 */
  text: string;
  /** 显示时间(ms)，默认 5000ms */
  duration?: number;
  /** 淡出动画时间(ms)，默认 200ms */
  fadeOutDuration?: number;
  /** 本地存储的 key，不传则不进行本地存储 */
  storageKey?: string;
  /** 最大显示次数，默认 3 次，仅在设置 storageKey 时生效 */
  maxShowCount?: number;
  /** 自定义类名 */
  className?: string;
}

class WeakTip {
  private tipDom: HTMLElement | null = null;
  private hasShown = false;
  private options: WeakTipOptions;

  constructor(options: WeakTipOptions) {
    this.options = {
      duration: 5000,
      fadeOutDuration: 200,
      maxShowCount: 3,
      ...options
    };
    this.initTipDom();
  }

  /** 初始化提示 DOM */
  private initTipDom() {
    // 创建提示 DOM
    this.tipDom = document.createElement('div');
    this.tipDom.className = `weak-tip ${this.options.className || ''}`.trim();
    this.tipDom.textContent = this.options.text;

    // 添加基础样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes zoomTipSlideIn {
        from {
          opacity: 0;
          margin-top: -10px;
        }
        to {
          opacity: 1;
          margin-top: 0;
        }
      }

      @keyframes zoomTipSlideOut {
        from {
          opacity: 1;
          margin-top: 0;
        }
        to {
          opacity: 0;
          margin-top: -10px;
        }
      }

      .weak-tip {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #fff;
        color: #333;
        font-size: 14px;
        padding: 20px 30px;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        display: none;
      }

      .weak-tip.show {
        display: block;
        animation: zoomTipSlideIn 0.2s ease-in-out forwards;
      }

      .weak-tip.hide {
        animation: zoomTipSlideOut 0.2s ease-in-out forwards;
      }
    `;

    // 将样式和提示 DOM 添加到 body
    document.head.appendChild(style);
    document.body.appendChild(this.tipDom);
  }

  /** 显示提示 */
  public show() {
    if (!this.tipDom || this.hasShown) return;

    // 只在设置了 storageKey 时才进行本地存储相关操作
    if (this.options.storageKey) {
      const count = Number(localStorage.getItem(this.options.storageKey) || '0');
      if (count >= (this.options.maxShowCount ?? 3)) return;

      // 更新显示次数
      localStorage.setItem(this.options.storageKey, String(count + 1));
    }

    this.hasShown = true;

    // 显示提示
    this.tipDom.classList.add('show');

    // 延时隐藏
    setTimeout(() => {
      this.tipDom?.classList.add('hide');
      // 等待淡出动画完成后销毁
      setTimeout(() => {
        this.destroy();
      }, this.options.fadeOutDuration);
    }, this.options.duration);
  }

  /** 销毁提示 */
  public destroy() {
    if (this.tipDom) {
      document.body.removeChild(this.tipDom);
      this.tipDom = null;
    }
  }
}

export default WeakTip; 