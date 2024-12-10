/**
 * @fileoverview Enhanced resize handle component for Figma plugin window
 * @packageDocumentation
 */

import { useCallback, useRef, useEffect } from "react";

interface Size {
  width: number;
  height: number;
}

interface ResizeMessage {
  type: "resize";
  size: {
    w: number;
    h: number;
  };
}

/**
 * ResizeHandle component for resizing the plugin window
 * Supports keyboard interaction and screen readers
 */
export function ResizeHandle() {
  const handleRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const initialSizeRef = useRef<Size>({ width: 0, height: 0 });
  const initialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  /**
   * Sends resize message to Figma
   */
  const sendResizeMessage = useCallback((width: number, height: number) => {
    const message: ResizeMessage = {
      type: "resize",
      size: {
        w: Math.max(50, Math.floor(width)),
        h: Math.max(50, Math.floor(height)),
      },
    };
    parent.postMessage({ pluginMessage: message }, "*");
  }, []);

  /**
   * Handles the pointer move event during resize
   */
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - initialPosRef.current.x;
      const deltaY = e.clientY - initialPosRef.current.y;

      const newWidth = initialSizeRef.current.width + deltaX;
      const newHeight = initialSizeRef.current.height + deltaY;

      sendResizeMessage(newWidth, newHeight);
    },
    [sendResizeMessage]
  );

  /**
   * Handles the pointer up event to end resizing
   */
  const handlePointerUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);

    // Reset cursor
    document.body.style.cursor = "";

    // Remove active class from handle
    handleRef.current?.classList.remove("active");
  }, [handlePointerMove]);

  /**
   * Handles the pointer down event to start resizing
   */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Store initial window size
      initialSizeRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      // Store initial pointer position
      initialPosRef.current = {
        x: e.clientX,
        y: e.clientY,
      };

      isDraggingRef.current = true;

      // Set cursor for entire document during drag
      document.body.style.cursor = "nw-resize";

      // Add active class to handle
      handleRef.current?.classList.add("active");

      // Add document-level event listeners
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    },
    [handlePointerMove, handlePointerUp]
  );

  /**
   * Handles keyboard interaction for accessibility
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const STEP = e.shiftKey ? 50 : 10;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          sendResizeMessage(
            window.innerWidth + STEP,
            window.innerHeight + STEP
          );
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          sendResizeMessage(
            window.innerWidth - STEP,
            window.innerHeight - STEP
          );
          break;
      }
    },
    [sendResizeMessage]
  );

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.body.style.cursor = "";
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={handleRef}
      role="button"
      tabIndex={0}
      aria-label="Resize plugin window"
      title="Drag to resize plugin window"
      className="
        fixed bottom-0 right-0 
        w-4 h-4 
        cursor-nw-resize
        hover:opacity-100
        focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-opacity
        group
      "
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="
          opacity-30
          group-hover:opacity-60
          group-[.active]:opacity-100
          transition-opacity
          dark:text-white
        "
      >
        <path
          d="M14,14 L8,14 L14,8 L14,14 Z M14,11 L11,14 M14,8 L8,14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <style>{`
        .active {
          opacity: 1;
        }
        
        /* Ensure handle is visible in dark mode */
        @media (prefers-color-scheme: dark) {
          .active svg {
            opacity: 1;
          }
        }

        /* Improve touch targets on mobile */
        @media (pointer: coarse) {
          .fixed {
            padding: 8px;
            margin: -8px;
          }
        }
      `}</style>
    </div>
  );
}
