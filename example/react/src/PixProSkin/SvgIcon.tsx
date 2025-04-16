import React, { useEffect, useState } from "react";
import "./SvgIcon.css";

interface SvgIconProps {
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 12, color, className = "", style = {} }) => {
  const [svgContent, setSvgContent] = useState("");

  const loadSvg = async () => {
    try {
      const svg = await import(`./assets/icon/${name}.svg?raw`);
      let svgText = svg.default;

      if (color) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, "image/svg+xml");
        const paths = doc.querySelectorAll("path, circle, rect, ellipse, line, polygon, polyline");

        paths.forEach((path) => {
          if (path.hasAttribute("stroke") && path.getAttribute("stroke") !== "none") {
            path.setAttribute("stroke", color);
          }
          if (path.hasAttribute("fill") && path.getAttribute("fill") !== "none") {
            path.setAttribute("fill", color);
          }
        });

        svgText = new XMLSerializer().serializeToString(doc.documentElement);
      }

      setSvgContent(svgText);
    } catch (error) {
      console.error(`Failed to load SVG: ${name}`, error);
    }
  };

  useEffect(() => {
    loadSvg();
  }, [name, color]);

  return <i className={`svg-icon ${className}`} style={{ fontSize: `${size}px`, ...style }} dangerouslySetInnerHTML={{ __html: svgContent }} />;
};

export default SvgIcon;
