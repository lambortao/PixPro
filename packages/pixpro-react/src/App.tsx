import React, { useState, useRef } from "react";
import PixProVue from "./PixProVue.tsx";
import "./App.css";

const App: React.FC = () => {
  console.log(123);

  const [pixProVisible, setPixProVisible] = useState(false);
  const [pixProAttrs, setPixProAttrs] = useState({
    cropRatios: {
      original: 0,
      "1:1": 1,
      "3:4": 3 / 4,
      "4:3": 4 / 3,
      "9:16": 9 / 16,
      "16:9": 16 / 9,
    },
    host: "https://api.pixpro.cc/",
    routes: "/image/processing",
    token: "",
    fitstImage: null as File | null,
    showDownloadBtn: true,
    eraserSize: {
      min: 20,
      max: 100,
      default: 50,
    },
  });
  const [imageSrc, setImageSrc] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const togglePixProVisible = (visible?: boolean) => {
    setPixProVisible(visible ?? !pixProVisible);
  };

  const handleExportImage = (image: string) => {
    setImageSrc(image);
  };

  const closeImageSrc = () => {
    setImageSrc("");
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = "pixpro-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerFileInput = () => {
    fileInput.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.type.startsWith("image/")) {
        setPixProAttrs({ ...pixProAttrs, fitstImage: file });
        togglePixProVisible();
        event.target.value = "";
      } else {
        alert("请选择图片文件");
      }
    }
  };

  return (
    <div className="upload-box">
      <div className="upload-container">
        <input type="file" ref={fileInput} accept="image/*" className="file-input" style={{ display: "none" }} onChange={handleFileChange} />
        <button className="upload-button" onClick={triggerFileInput}>
          点击上传图片
        </button>
      </div>

      {pixProVisible && (
        <div className="pix-pro-box">
          <PixProVue {...pixProAttrs} onClose={() => togglePixProVisible(false)} onExportImage={handleExportImage} />
        </div>
      )}

      {imageSrc && (
        <div className="export-img-box">
          <img src={imageSrc} alt="" />
          <div className="buttons-container">
            <div className="action-btn download-btn">
              <button onClick={handleDownload}>下载</button>
            </div>
            <div className="action-btn close-btn">
              <button onClick={closeImageSrc}>关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
