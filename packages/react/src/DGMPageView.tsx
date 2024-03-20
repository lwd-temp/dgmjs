import { Document, Page, renderOnCanvas } from "@dgmjs/core";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface DGMPageViewProps extends React.HTMLAttributes<HTMLDivElement> {
  doc: Document;
  page: Page;
  darkMode?: boolean;
  scaleAdjust?: number;
}

export interface DGMPageViewHandle {
  repaint: () => void;
}

export const DGMPageView = forwardRef<DGMPageViewHandle, DGMPageViewProps>(
  (
    {
      doc,
      page,
      darkMode = false,
      scaleAdjust = 1,
      style,
      children,
      ...others
    },
    ref
  ) => {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const heightRatio = doc.size ? doc.size[1] / doc.size[0] : 0.75;
    const [size, setSize] = useState([0, 0]);

    const repaint = (width: number, height: number) => {
      if (canvasRef.current) {
        renderOnCanvas(
          [page],
          canvasRef.current,
          darkMode,
          doc.size,
          [width, height],
          scaleAdjust
        );
      }
    };

    useImperativeHandle(ref, () => ({
      repaint: () => repaint(size[0], size[1]),
    }));

    useEffect(() => {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const rect = entry.contentRect;
          const { width } = rect;
          const height = Math.round(width * heightRatio);
          setSize([width, height]);
          if (wrapperRef.current) {
            wrapperRef.current.style.height = `${height}px`;
          }
          repaint(width, height);
        }
      });
      wrapperRef.current && observer.observe(wrapperRef.current);
    }, [darkMode, doc, page]);

    return (
      <div
        ref={wrapperRef}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          ...style,
        }}
        {...others}
      >
        <canvas ref={canvasRef} style={{ width: "100%" }} />
        {children}
      </div>
    );
  }
);

DGMPageView.displayName = "DGMPageView";