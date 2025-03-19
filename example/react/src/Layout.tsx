import { useEffect, useRef } from "react";
import "./Layout.css";

const Layout = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = document.getElementById("container-canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  return (
    <>
      <h1>图片编辑器功能</h1>
      <div className="photo-studio-container">
        <div className="upload-container">
          <div className="upload-container-input">
            <input type="file" name="file" id="file" accept=".png,.jpg,.jpeg" />
            <div>
              <span>
                <svg focusable="false" data-icon="inbox" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="0 0 1024 1024">
                  <path d="M885.2 446.3l-.2-.8-112.2-285.1c-5-16.1-19.9-27.2-36.8-27.2H281.2c-17 0-32.1 11.3-36.9 27.6L139.4 443l-.3.7-.2.8c-1.3 4.9-1.7 9.9-1 14.8-.1 1.6-.2 3.2-.2 4.8V830a60.9 60.9 0 0060.8 60.8h627.2c33.5 0 60.8-27.3 60.9-60.8V464.1c0-1.3 0-2.6-.1-3.7.4-4.9 0-9.6-1.3-14.1zm-295.8-43l-.3 15.7c-.8 44.9-31.8 75.1-77.1 75.1-22.1 0-41.1-7.1-54.8-20.6S436 441.2 435.6 419l-.3-15.7H229.5L309 210h399.2l81.7 193.3H589.4zm-375 76.8h157.3c24.3 57.1 76 90.8 140.4 90.8 33.7 0 65-9.4 90.3-27.2 22.2-15.6 39.5-37.4 50.7-63.6h156.5V814H214.4V480.1z"></path>
                </svg>
              </span>
              <p>点击上传图片或者将图片拖入虚线框内</p>
            </div>
          </div>
        </div>
        <div className="preview-control-container hide">
          <div className="preview-container">
            <canvas id="container-canvas"></canvas>
          </div>
          <div className="control-container">
            <span className="tl"></span>
            <span className="tc inline"></span>
            <span className="tr"></span>
            <span className="ml inline"></span>
            <span className="mr inline"></span>
            <span className="bl"></span>
            <span className="bc inline"></span>
            <span className="br"></span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Layout;
