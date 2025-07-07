class AiLoading extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.width = 200;
    this.height = 200;
    this.observer = null;
    this.containerSize = { width: 0, height: 0 };
  }

  static get observedAttributes() {
    return ["width", "height"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this[name] = newValue;
      // this.updateStyles();
    }
  }

  get baseScale() {
    const diagonal = Math.sqrt(Math.pow(this.containerSize.width, 2) + Math.pow(this.containerSize.height, 2));
    return (diagonal / 2000) * 1.2;
  }

  updateContainerSize() {
    this.containerSize = {
      width: this.shadowRoot.querySelector(".loader-container").clientWidth,
      height: this.shadowRoot.querySelector(".loader-container").clientHeight,
    };
    this.updateKeyframes();
  }

  updateKeyframes() {
    const keyframes = Array.from({ length: 20 }, (_, i) => {
      const progress = i / 19;
      const angle = progress * 2160;
      const scale = 0.8 + Math.abs(Math.sin(progress * Math.PI * 4)) * 0.8;
      const translateX = Math.sin(progress * Math.PI * 6) * 2;
      const translateY = Math.cos(progress * Math.PI * 3) * 3;

      return `
        ${((i / 19) * 100).toFixed(2)}% {
          transform: translate(-50%, -50%) 
            scale(${this.baseScale * scale}) 
            rotate(${angle}deg)
            translate(${translateX}%, ${translateY}%);
        }`;
    }).join("");

    const styleElement = this.shadowRoot.querySelector("#animation-style");
    if (styleElement) {
      styleElement.textContent = `
        @keyframes complexAnimation {
          ${keyframes}
        }`;
    }
  }

  // updateStyles() {
  // const container = this.shadowRoot.querySelector(".loader-container");
  // if (container) {
  //   container.style.width = typeof this.width === "number" ? `${this.width}px` : this.width;
  //   container.style.height = typeof this.height === "number" ? `${this.height}px` : this.height;
  // }
  // }

  connectedCallback() {
    const style = document.createElement("style");
    style.id = "animation-style";

    const baseStyles = document.createElement("style");
    baseStyles.textContent = `
      .loader-container {
        position: relative;
        overflow: hidden;
        background-color: transparent;
      }

      .animated-image {
        position: absolute;
        top: 50%;
        left: 50%;
        animation: complexAnimation 12s infinite linear;
        transform-origin: center center;
        min-width: 2000px;
        min-height: 2000px;
        will-change: transform;
      }

      .center-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    `;

    const template = document.createElement("div");
    template.className = "loader-container";
    template.innerHTML = `
      <img
        class="animated-image"
        src="./src/img/loading.png"
        alt="loading"
      />
       <img
        class="center-loading"
        src="./src/img/icon/loading.svg"
        alt="loading"
      />
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(baseStyles);
    this.shadowRoot.appendChild(template);

    this.updateContainerSize();
    this.observer = new ResizeObserver(() => this.updateContainerSize());
    this.observer.observe(this.shadowRoot.querySelector(".loader-container"));
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  updateSize(width, height) {
    const animatedImage = this.shadowRoot.querySelector(".loader-container");

    if (animatedImage) {
      animatedImage.style.width = `${width}px`;
      animatedImage.style.height = `${height}px`;
      animatedImage.style.minWidth = `${width}px`;
      animatedImage.style.minHeight = `${height}px`;
    }
  }
}

// Register the custom element
customElements.define("ai-loading", AiLoading);
