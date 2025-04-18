/**
 * 彩色按钮组件
 * 创建一个具有渐变背景色的按钮
 */
class ColoredBtn extends HTMLElement {
  constructor() {
    super();
    this._text = "";
    this._icon = "";
    this._disabled = false;
    this._loading = false;
  }

  static get observedAttributes() {
    return ["text", "icon", "disabled", "loading"];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case "text":
          this._text = newValue;
          break;
        case "icon":
          this._icon = newValue;
          break;
        case "disabled":
          this._disabled = newValue !== null;
          break;
        case "loading":
          this._loading = newValue !== null;
          break;
      }
      this.render();
    }
  }

  get text() {
    return this._text;
  }

  set text(value) {
    this._text = value;
    this.setAttribute("text", value);
  }

  get icon() {
    return this._icon;
  }

  set icon(value) {
    this._icon = value;
    this.setAttribute("icon", value);
  }

  get disabled() {
    return this._disabled;
  }

  set disabled(value) {
    this._disabled = value;
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get loading() {
    return this._loading;
  }

  set loading(value) {
    this._loading = value;
    if (value) {
      this.setAttribute("loading", "");
    } else {
      this.removeAttribute("loading");
    }
  }

  render() {
    // 清空当前内容
    this.innerHTML = "";

    // 创建按钮元素
    const button = document.createElement("button");
    button.className = "colored-btn";

    if (this._disabled) {
      button.disabled = true;
    }

    if (this._loading) {
      button.classList.add("loading");
    }

    // 添加图标（如果有）
    if (this._icon) {
      const svgIcon = document.createElement("svg-icon");
      svgIcon.setAttribute("name", this._icon);
      button.appendChild(svgIcon);
    }

    // 添加文本
    const span = document.createElement("span");
    span.textContent = this._text;
    button.appendChild(span);

    // 添加点击事件
    button.addEventListener("click", (e) => {
      if (!this._disabled && !this._loading) {
        // 触发自定义事件
        this.dispatchEvent(
          new CustomEvent("click", {
            bubbles: true,
            cancelable: true,
            detail: {},
          })
        );
      }
    });

    this.appendChild(button);
  }
}

// 注册自定义元素
customElements.define("colored-btn", ColoredBtn);
