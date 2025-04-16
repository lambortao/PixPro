/**
 * 角度调整组件
 * 创建一个可以调整角度的垂直尺子组件
 */
class AngleAdjustment extends HTMLElement {
  constructor() {
    super();
    this._angle = 0;
    this._maxAngle = 180;
    this._isDragging = false;
    this._startY = 0;
    this._startAngle = 0;
    this._snapThreshold = 1;
    this._isSnapping = false;
  }

  static get observedAttributes() {
    return ["angle", "max-angle"];
  }

  connectedCallback() {
    this.render();
    this._setupEventListeners();
  }

  disconnectedCallback() {
    this._removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case "angle":
          this._angle = parseFloat(newValue) || 0;
          this._updateRulerPosition();
          break;
        case "max-angle":
          this._maxAngle = parseFloat(newValue) || 180;
          this.render();
          break;
      }
    }
  }

  get angle() {
    return this._angle;
  }

  set angle(value) {
    this._angle = parseFloat(value) || 0;
    this.setAttribute("angle", this._angle);
    this._updateRulerPosition();
  }

  get maxAngle() {
    return this._maxAngle;
  }

  set maxAngle(value) {
    this._maxAngle = parseFloat(value) || 180;
    this.setAttribute("max-angle", this._maxAngle);
    this.render();
  }

  render() {
    // 清空现有内容
    this.innerHTML = "";

    // 创建容器
    const rotateRuler = document.createElement("div");
    rotateRuler.className = "rotate-ruler";

    // 创建滑动容器
    const slideContainer = document.createElement("div");
    slideContainer.className = "slide-container";
    slideContainer.style.height = `${(this._maxAngle / 3) * 9}px`;

    // 创建标尺内容
    const rulerContent = document.createElement("div");
    rulerContent.className = "ruler-content";

    // 创建刻度容器
    const rulerScale = document.createElement("div");
    rulerScale.className = "ruler-scale";

    // 添加刻度行
    for (let i = 0; i <= this._maxAngle / 3; i++) {
      const scaleRow = document.createElement("div");
      scaleRow.className = "scale-row";

      // 添加数字单元格
      const numberCell = document.createElement("div");
      numberCell.className = "number-cell";
      if (i % 5 === 0) {
        const span = document.createElement("span");
        span.textContent = `${i * 3 - this._maxAngle / 2}°`;
        numberCell.appendChild(span);
      }

      // 添加刻度单元格
      const scaleCell = document.createElement("div");
      scaleCell.className = `scale-cell${i % 5 === 0 ? " major-scale" : ""}`;

      const scaleLine = document.createElement("div");
      scaleLine.className = "scale-line";
      scaleCell.appendChild(scaleLine);

      scaleRow.appendChild(numberCell);
      scaleRow.appendChild(scaleCell);
      rulerScale.appendChild(scaleRow);
    }

    // 添加指针
    const rulerPointer = document.createElement("div");
    rulerPointer.className = "ruler-pointer";

    const svgIcon = document.createElement("img");
    svgIcon.src = "/src/img/icon/pointer.svg";
    rulerPointer.appendChild(svgIcon);

    // 组装组件
    rulerContent.appendChild(rulerScale);
    slideContainer.appendChild(rulerContent);
    rotateRuler.appendChild(slideContainer);
    rotateRuler.appendChild(rulerPointer);

    this.appendChild(rotateRuler);

    // 保存重要元素的引用
    this._rotateRuler = rotateRuler;
    this._slideContainer = slideContainer;

    // 更新尺子位置
    this._updateRulerPosition();
  }

  _setupEventListeners() {
    this._handleWheel = this._handleWheel.bind(this);
    this._startDrag = this._startDrag.bind(this);
    this._handleDrag = this._handleDrag.bind(this);
    this._stopDrag = this._stopDrag.bind(this);

    this.addEventListener("wheel", this._handleWheel);
    this.addEventListener("mousedown", this._startDrag);
    document.addEventListener("mousemove", this._handleDrag);
    document.addEventListener("mouseup", this._stopDrag);
    document.addEventListener("mouseleave", this._stopDrag);
  }

  _removeEventListeners() {
    this.removeEventListener("wheel", this._handleWheel);
    this.removeEventListener("mousedown", this._startDrag);
    document.removeEventListener("mousemove", this._handleDrag);
    document.removeEventListener("mouseup", this._stopDrag);
    document.removeEventListener("mouseleave", this._stopDrag);
  }

  _checkSnap(angle) {
    if (Math.abs(angle) <= this._snapThreshold) {
      this._isSnapping = true;
      this._slideContainer.style.transition = "transform 100ms ease-out";
      setTimeout(() => {
        this._isSnapping = false;
        this._slideContainer.style.transition = "none";
      }, 50);
      return 0;
    }
    this._isSnapping = false;
    this._slideContainer.style.transition = "none";
    return angle;
  }

  _handleWheel(e) {
    e.preventDefault();
    const step = Math.abs(this._angle) <= this._snapThreshold ? 6 : 3;
    const direction = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.max(-this._maxAngle / 2, Math.min(this._maxAngle / 2, this._angle + direction * step));

    if (this._isSnapping) return;

    // 触发提醒图片显示事件
    this.dispatchEvent(new CustomEvent("handle-remind-image", { detail: { visible: true } }));

    const snappedValue = this._checkSnap(newValue);
    this.angle = snappedValue;
    this._emitChangeEvent();
  }

  _startDrag(e) {
    this._isDragging = true;
    this._startY = e.clientY;
    this._startAngle = this._angle;
    // 触发提醒图片显示事件
    this.dispatchEvent(new CustomEvent("handle-remind-image", { detail: { visible: true } }));
  }

  _handleDrag(e) {
    if (!this._isDragging) return;
    const deltaY = e.clientY - this._startY;
    const newAngle = this._startAngle + Math.round(deltaY / 3);
    const boundedAngle = Math.max(-this._maxAngle / 2, Math.min(this._maxAngle / 2, newAngle));

    if (this._isSnapping) return;

    const snappedValue = this._checkSnap(boundedAngle);
    this.angle = snappedValue;
    this._emitChangeEvent();
  }

  _stopDrag() {
    if (this._isDragging) {
      const snappedValue = this._checkSnap(this._angle);
      if (snappedValue !== this._angle) {
        this.angle = snappedValue;
        this._emitChangeEvent();
      }
      // 触发提醒图片隐藏事件
      this.dispatchEvent(new CustomEvent("handle-remind-image", { detail: { visible: false } }));
    }
    this._isDragging = false;
  }

  _updateRulerPosition() {
    if (this._slideContainer) {
      this._slideContainer.style.transform = `translateY(${this._angle * 3}px)`;
    }
  }

  _emitChangeEvent() {
    this.dispatchEvent(
      new CustomEvent("change", {
        bubbles: true,
        detail: { angle: this._angle },
      })
    );
  }
}

// 注册自定义元素
customElements.define("angle-adjustment", AngleAdjustment);
