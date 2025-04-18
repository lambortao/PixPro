class EraserSizeSlider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    // 初始化属性
    this._min = 20;
    this._max = 100;
    this._size = 50;
    this.isHovering = false;
    this.cursorCircle = null;
    this.inputRef = null;

    // 创建自定义事件
    this._sizeChangeEvent = new CustomEvent("size-change", {
      detail: this._size,
      bubbles: true,
      composed: true,
    });

    // 创建HTML结构
    const template = document.createElement("template");
    template.innerHTML = `
      <div style="padding-bottom: 20px">
        <small>橡皮擦大小</small>
        <input type="range" />
        <div class="cursor-circle" 
        style="
          position: fixed;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: rgb(72, 120, 239);
          opacity: 0.3;
          pointer-events: none;
          z-index: 12;
          display: none;
          transform: translate(-50%, -50%);"></div>
      </div>
    `;

    // 创建 style
    const style = document.createElement("style");
    style.textContent = `
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
        transition: opacity 0.2s;
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
    `;

    // Add style and template to shadow DOM
    this.shadowRoot.appendChild(style);

    // 添加到shadow DOM
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // 获取元素引用
    this.inputRef = this.shadowRoot.querySelector("input");
    this.cursorCircle = this.shadowRoot.querySelector(".cursor-circle");

    // 绑定事件处理函数
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.updateCirclePosition = this.updateCirclePosition.bind(this);

    // 添加事件监听
    this.inputRef.addEventListener("mouseenter", this.handleMouseEnter);
    this.inputRef.addEventListener("mouseleave", this.handleMouseLeave);
    this.inputRef.addEventListener("input", this.handleInput);
    window.addEventListener("resize", this.updateCirclePosition);
  }

  static get observedAttributes() {
    return ["min", "max", "size", "default-size"];
  }

  // Getter和Setter
  get min() {
    return this._min;
  }

  set min(value) {
    this._min = parseInt(value) || 20;
    if (this.inputRef) {
      this.inputRef.min = this._min;
      this.updateSliderBackground();
    }
  }

  get max() {
    return this._max;
  }

  set max(value) {
    this._max = parseInt(value) || 100;
    if (this.inputRef) {
      this.inputRef.max = this._max;
      this.updateSliderBackground();
    }
  }

  get size() {
    return this._size;
  }

  set size(value) {
    const newSize = parseInt(value) || 50;
    if (this._size !== newSize) {
      this._size = newSize;
      if (this.inputRef) {
        this.inputRef.value = this._size;
        this.updateSliderBackground();
        this.updateCirclePosition();
      }
      // 创建新的CustomEvent，而不是修改现有事件的detail
      this._sizeChangeEvent = new CustomEvent("size-change", {
        detail: this._size,
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(this._sizeChangeEvent);
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case "min":
        this.min = newValue;
        break;
      case "max":
        this.max = newValue;
        break;
      case "size":
      case "default-size":
        this.size = newValue;
        break;
    }
  }

  connectedCallback() {
    // 设置初始属性
    this.inputRef.min = this.min;
    this.inputRef.max = this.max;
    this.inputRef.value = this.size;
    this.updateSliderBackground();
  }

  disconnectedCallback() {
    // 移除事件监听
    this.inputRef.removeEventListener("mouseenter", this.handleMouseEnter);
    this.inputRef.removeEventListener("mouseleave", this.handleMouseLeave);
    this.inputRef.removeEventListener("input", this.handleInput);
    window.removeEventListener("resize", this.updateCirclePosition);
  }

  handleMouseEnter() {
    this.isHovering = true;
    this.cursorCircle.style.display = "block";
    this.updateCirclePosition();
  }

  handleMouseLeave() {
    this.isHovering = false;
    this.cursorCircle.style.display = "none";
  }

  handleInput(event) {
    this.size = event.target.value;
  }

  updateCirclePosition() {
    if (!this.isHovering || !this.inputRef || !this.cursorCircle) return;

    const rect = this.inputRef.getBoundingClientRect();
    const thumbWidth = 16; // 滑块按钮的宽度
    const range = this.max - this.min; // 滑块的范围
    const percentage = (this.size - this.min) / range; // 当前值在范围内的百分比

    // 计算滑块按钮的位置
    const thumbPosition = rect.left + (rect.width - thumbWidth) * percentage + thumbWidth / 2;

    this.cursorCircle.style.left = `${thumbPosition}px`;
    this.cursorCircle.style.top = `${rect.top + rect.height / 2}px`;
    this.cursorCircle.style.width = `${this.size}px`;
    this.cursorCircle.style.height = `${this.size}px`;
    this.cursorCircle.style.display = this.isHovering ? "block" : "none";
  }

  updateSliderBackground() {
    const percentage = ((this.size - this.min) / (this.max - this.min)) * 100;
    this.inputRef.style.background = `linear-gradient(to right, #4878ef 0%, #4878ef ${percentage}%, #e0e0e0 ${percentage}%, #e0e0e0 100%)`;
    this.updateCirclePosition();
  }
}

// 注册自定义元素
customElements.define("eraser-size-slider", EraserSizeSlider);
