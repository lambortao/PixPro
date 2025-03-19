import { useEffect, useRef } from "react";
import "./Test.css";

const Test = () => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!boxRef.current) return;

    const box = boxRef.current;
    const boxRect = box.getBoundingClientRect();

    let activeElement: HTMLElement | null = null;
    let nowDraggable: "n" | "s" | null = null;
    let rafId: number | null = null;

    let startX = 0;
    let startY = 0;
    let mouseLeft = 0;
    let mouseTop = 0;
    let move = false;

    const handleMouseDown = (e: MouseEvent) => {
      activeElement = e.target as HTMLElement;
      nowDraggable = activeElement.dataset.draggable as "n" | "s";
      if (!nowDraggable) return;

      move = true;
      mouseLeft = e.clientX;
      mouseTop = e.clientY;

      const rect = activeElement.getBoundingClientRect();
      startX = rect.left - boxRect.left;
      startY = rect.top - boxRect.top;
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (move && activeElement && nowDraggable) {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          const nowRect = activeElement!.getBoundingClientRect();
          const moveX = e.clientX - mouseLeft;
          const moveY = e.clientY - mouseTop;
          const newLeft = moveX + startX;
          const newTop = moveY + startY;

          const clampedLeft = Math.max(0, Math.min(newLeft, boxRect.width - nowRect.width));
          const clampedTop = Math.max(0, Math.min(newTop, boxRect.height - nowRect.height));

          activeElement!.style.top = `${clampedTop}px`;
          activeElement!.style.left = `${clampedLeft}px`;
        });
      }
      e.preventDefault();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (activeElement) {
        startX = activeElement.style.left ? parseInt(activeElement.style.left) - boxRect.left : 0;
        startY = activeElement.style.top ? parseInt(activeElement.style.top) - boxRect.top : 0;
      }

      move = false;
      nowDraggable = null;
      activeElement = null;
      mouseLeft = 0;
      mouseTop = 0;

      e.preventDefault();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="box" ref={boxRef}>
      <div data-draggable="n" className="dots n"></div>
      <div data-draggable="s" className="dots s"></div>
    </div>
  );
};

export default Test;
