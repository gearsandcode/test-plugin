import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

interface TooltipOptions {
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  align?: "start" | "center" | "end";
  alignOffset?: number;
  avoidCollisions?: boolean;
  collisionBoundary?: Element | null | Array<Element>;
  collisionPadding?:
    | number
    | Partial<Record<"top" | "right" | "bottom" | "left", number>>;
  arrowPadding?: number;
  sticky?: "partial" | "always";
}

interface TooltipDemoProps extends TooltipOptions {
  text: string;
  trigger: React.ReactElement;
  "aria-label"?: string;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      style={{ width: 240 }}
      className="z-[80] rounded-md border border-black/10 dark:border-white/10 bg-stone-100 dark:bg-stone-800 px-4 py-2 text-xs"
      {...props}
    >
      {children}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

const Tooltip = ({
  text,
  trigger,
  "aria-label": ariaLabel,
  side = "left",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  avoidCollisions = true,
  collisionBoundary,
  collisionPadding = 8,
  arrowPadding = 0,
  sticky = "partial",
}: TooltipDemoProps) => (
  <TooltipProvider>
    <TooltipRoot>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent
        aria-label={ariaLabel}
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        avoidCollisions={avoidCollisions}
        collisionBoundary={collisionBoundary}
        collisionPadding={collisionPadding}
        arrowPadding={arrowPadding}
        sticky={sticky}
      >
        <p>{text}</p>
      </TooltipContent>
    </TooltipRoot>
  </TooltipProvider>
);

export {
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Tooltip,
  type TooltipOptions,
  type TooltipDemoProps,
};
