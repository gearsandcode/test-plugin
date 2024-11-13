import { useRef } from "react";

const ResizeHandle = () => {
  const cornerRef = useRef<SVGSVGElement>(null);

  const resizeWindow = (e: { clientX: number; clientY: number }) => {
    const size = {
      w: Math.max(50, Math.floor(e.clientX + 5)),
      h: Math.max(50, Math.floor(e.clientY + 5)),
    };
    parent.postMessage({ pluginMessage: { type: "resize", size: size } }, "*");
  };

  interface PointerEvent {
    clientX: number;
    clientY: number;
    pointerId: number;
  }

  const handlePointerDown = (e: PointerEvent) => {
    const corner = cornerRef.current;
    if (corner) {
      corner.onpointermove = resizeWindow;
      corner.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    const corner = cornerRef.current;
    if (corner) {
      corner.onpointermove = null;
      corner.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="fixed bottom-0 m-2 right-0 w-4 h-4 cursor-nw-resize">
      <svg
        ref={cornerRef}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <path
          d="M14,14 L8,14 L14,8 L14,14 Z M14,11 L11,14 M14,8 L8,14"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="1.25"
        />
      </svg>
    </div>
  );
};

export default ResizeHandle;
