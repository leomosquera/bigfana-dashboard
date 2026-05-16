"use client";

/**
 * BigFana Popover
 *
 * Wrapper around @radix-ui/react-popover that integrates the BigFana
 * surface/motion system. The open state is lifted into a React context so
 * Framer Motion's AnimatePresence can animate mount/unmount correctly.
 *
 * Compound anatomy:
 *   <Popover>
 *     <Popover.Trigger asChild>
 *       <Button>Open</Button>
 *     </Popover.Trigger>
 *     <Popover.Content align="start">
 *       ...content...
 *     </Popover.Content>
 *   </Popover>
 */

import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import {
  createContext,
  forwardRef,
  useContext,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { scaleInProps } from "@/lib/design-system/motion";

// ─── Internal open-state context ─────────────────────────────────────────────

const PopoverOpenContext = createContext<boolean>(false);

// ─── Popover.Root ─────────────────────────────────────────────────────────────

export type PopoverRootProps = RadixPopover.PopoverProps;

export function PopoverRoot({
  open: controlledOpen,
  onOpenChange,
  defaultOpen,
  children,
  ...props
}: PopoverRootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isOpen = controlledOpen ?? internalOpen;

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <PopoverOpenContext.Provider value={isOpen}>
      <RadixPopover.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </RadixPopover.Root>
    </PopoverOpenContext.Provider>
  );
}
PopoverRoot.displayName = "PopoverRoot";

// ─── Re-exports (pass-throughs) ───────────────────────────────────────────────

export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverPortal  = RadixPopover.Portal;
export const PopoverAnchor  = RadixPopover.Anchor;
export const PopoverClose   = RadixPopover.Close;

// ─── Popover.Content ──────────────────────────────────────────────────────────

export interface PopoverContentProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof RadixPopover.Content>,
    "asChild"
  > {
  /** Remove default padding */
  noPadding?: boolean;
  /** Render a close button in the top-right corner */
  showClose?: boolean;
  /** Portal container — defaults to document.body */
  container?: HTMLElement | null;
}

export const PopoverContent = forwardRef<
  React.ElementRef<typeof RadixPopover.Content>,
  PopoverContentProps
>(
  (
    {
      className,
      noPadding = false,
      showClose = false,
      container,
      children,
      sideOffset = 8,
      collisionPadding = 12,
      align = "start",
      ...props
    },
    ref
  ) => {
    const isOpen = useContext(PopoverOpenContext);

    return (
      <RadixPopover.Portal container={container ?? undefined}>
        {/* forceMount keeps the DOM node alive so AnimatePresence can exit-animate */}
        <RadixPopover.Content
          ref={ref}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          align={align}
          forceMount
          {...props}
          className="z-40 outline-none"
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="popover-panel"
                {...scaleInProps()}
                className={cn(
                  "rounded-2xl border border-white/[0.10]",
                  "bg-[#1C1C2A]",
                  "shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
                  "backdrop-blur-xl",
                  !noPadding && "p-3",
                  className
                )}
              >
                {showClose && (
                  <RadixPopover.Close
                    className={cn(
                      "absolute top-3 right-3 z-10",
                      "w-6 h-6 flex items-center justify-center rounded-lg",
                      "text-[#55556A] hover:text-[#F0F0F8] hover:bg-white/[0.06]",
                      "transition-all duration-150"
                    )}
                    aria-label="Close"
                  >
                    <X size={13} />
                  </RadixPopover.Close>
                )}
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </RadixPopover.Content>
      </RadixPopover.Portal>
    );
  }
);
PopoverContent.displayName = "PopoverContent";

// ─── Popover.Arrow ────────────────────────────────────────────────────────────

export function PopoverArrow({ className }: { className?: string }) {
  return (
    <RadixPopover.Arrow
      className={cn("fill-[#1C1C2A]", className)}
      width={10}
      height={5}
    />
  );
}
PopoverArrow.displayName = "PopoverArrow";

// ─── Compound export ──────────────────────────────────────────────────────────

/**
 * Popover — compound primitive for all floating content in BigFana.
 *
 * @example
 * <Popover>
 *   <Popover.Trigger asChild>
 *     <Button intent="secondary" size="sm">Open popover</Button>
 *   </Popover.Trigger>
 *   <Popover.Content align="start" sideOffset={8}>
 *     <p className="text-sm text-[#F0F0F8]">Popover content here</p>
 *   </Popover.Content>
 * </Popover>
 */
export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Arrow:   PopoverArrow,
  Portal:  PopoverPortal,
  Anchor:  PopoverAnchor,
  Close:   PopoverClose,
});
