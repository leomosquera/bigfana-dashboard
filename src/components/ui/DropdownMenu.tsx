"use client";

/**
 * BigFana DropdownMenu
 *
 * Fully-styled compound menu built on @radix-ui/react-dropdown-menu.
 * Handles action menus, card header menus, row action menus, and any
 * context-style trigger → panel pattern.
 *
 * All visual tokens come from the BigFana design system. Animation uses
 * the shared motion system (scaleIn). Icons are Lucide outline only.
 *
 * Anatomy:
 *   <DropdownMenu>
 *     <DropdownMenu.Trigger asChild>
 *       <Button size="icon-sm" intent="ghost"><MoreHorizontal size={14} /></Button>
 *     </DropdownMenu.Trigger>
 *     <DropdownMenu.Content align="end">
 *       <DropdownMenu.Label>Actions</DropdownMenu.Label>
 *       <DropdownMenu.Item icon={<Eye />}>View</DropdownMenu.Item>
 *       <DropdownMenu.Item icon={<Pencil />}>Edit</DropdownMenu.Item>
 *       <DropdownMenu.Separator />
 *       <DropdownMenu.Item icon={<Trash2 />} variant="destructive">Delete</DropdownMenu.Item>
 *     </DropdownMenu.Content>
 *   </DropdownMenu>
 *
 *   Sub-menu:
 *     <DropdownMenu.Sub>
 *       <DropdownMenu.SubTrigger>More options</DropdownMenu.SubTrigger>
 *       <DropdownMenu.SubContent>
 *         <DropdownMenu.Item>Option A</DropdownMenu.Item>
 *       </DropdownMenu.SubContent>
 *     </DropdownMenu.Sub>
 *
 *   Checkable items:
 *     <DropdownMenu.CheckboxItem checked={checked} onCheckedChange={setChecked}>
 *       Show labels
 *     </DropdownMenu.CheckboxItem>
 *
 *     <DropdownMenu.RadioGroup value={view} onValueChange={setView}>
 *       <DropdownMenu.RadioItem value="list">List</DropdownMenu.RadioItem>
 *       <DropdownMenu.RadioItem value="grid">Grid</DropdownMenu.RadioItem>
 *     </DropdownMenu.RadioGroup>
 */

import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronRight, Circle } from "lucide-react";
import {
  createContext,
  forwardRef,
  useContext,
  useState,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { scaleInProps } from "@/lib/design-system/motion";
import { zLayerTw } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";

// ─── Internal open-state context ─────────────────────────────────────────────

const DropdownOpenContext = createContext<boolean>(false);

// ─── DropdownMenu.Root ────────────────────────────────────────────────────────

export type DropdownMenuRootProps = RadixDropdown.DropdownMenuProps;

function DropdownMenuRoot({
  open: controlledOpen,
  onOpenChange,
  defaultOpen,
  children,
  ...props
}: DropdownMenuRootProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isOpen = controlledOpen ?? internalOpen;

  function handleOpenChange(next: boolean) {
    setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <DropdownOpenContext.Provider value={isOpen}>
      <RadixDropdown.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </RadixDropdown.Root>
    </DropdownOpenContext.Provider>
  );
}
DropdownMenuRoot.displayName = "DropdownMenuRoot";

// ─── Re-exports ───────────────────────────────────────────────────────────────

export const DropdownMenuTrigger    = RadixDropdown.Trigger;
export const DropdownMenuPortal     = RadixDropdown.Portal;
export const DropdownMenuGroup      = RadixDropdown.Group;
export const DropdownMenuRadioGroup = RadixDropdown.RadioGroup;
export const DropdownMenuSub        = RadixDropdown.Sub;

// ─── DropdownMenu.Content ─────────────────────────────────────────────────────

export interface DropdownMenuContentProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof RadixDropdown.Content>,
    "asChild"
  > {
  /** Portal container — defaults to document.body */
  container?: HTMLElement | null;
  /** Minimum width of the panel */
  minWidth?: number;
}

export const DropdownMenuContent = forwardRef<
  React.ElementRef<typeof RadixDropdown.Content>,
  DropdownMenuContentProps
>(
  (
    {
      className,
      container,
      minWidth = 180,
      children,
      sideOffset = 6,
      collisionPadding = 12,
      align = "end",
      ...props
    },
    ref
  ) => {
    const isOpen = useContext(DropdownOpenContext);

    return (
      <RadixDropdown.Portal container={container ?? undefined}>
        <RadixDropdown.Content
          ref={ref}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          align={align}
          forceMount
          {...props}
          className={cn(zLayerTw("nestedOverlay"), "outline-none")}
          style={{ minWidth }}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="dropdown-panel"
                {...scaleInProps()}
                className={cn(
                  "rounded-xl border border-white/[0.10]",
                  "bg-[#1C1C2A]",
                  "shadow-[0_16px_60px_rgba(0,0,0,0.55)]",
                  "backdrop-blur-xl",
                  "py-1 overflow-hidden",
                  className
                )}
              >
                {children}
              </motion.div>
            )}
          </AnimatePresence>
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    );
  }
);
DropdownMenuContent.displayName = "DropdownMenuContent";

// ─── Item CVA ─────────────────────────────────────────────────────────────────

const itemVariants = cva(
  [
    "relative flex items-center gap-2.5",
    "px-3 py-2 mx-1 rounded-lg",
    "text-sm font-medium cursor-pointer select-none outline-none",
    "transition-colors duration-100",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
  ].join(" "),
  {
    variants: {
      variant: {
        default:     "text-[#C8C8E0] hover:text-[#F0F0F8] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-[#F0F0F8]",
        destructive: "text-red-400 hover:text-red-300 hover:bg-red-500/[0.10] focus:bg-red-500/[0.10] focus:text-red-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

// ─── DropdownMenu.Item ────────────────────────────────────────────────────────

export interface DropdownMenuItemProps
  extends React.ComponentPropsWithoutRef<typeof RadixDropdown.Item>,
    VariantProps<typeof itemVariants> {
  /** Leading Lucide icon */
  icon?: React.ReactNode;
  /** Trailing shortcut hint e.g. "⌘K" */
  shortcut?: string;
}

export const DropdownMenuItem = forwardRef<
  React.ElementRef<typeof RadixDropdown.Item>,
  DropdownMenuItemProps
>(({ className, variant, icon, shortcut, children, ...props }, ref) => (
  <RadixDropdown.Item
    ref={ref}
    className={cn(itemVariants({ variant }), className)}
    {...props}
  >
    {icon && (
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#8888AA]">
        {icon}
      </span>
    )}
    <span className="flex-1 truncate">{children}</span>
    {shortcut && (
      <span className="ml-auto pl-4 text-xs text-[#55556A] font-mono tracking-wider shrink-0">
        {shortcut}
      </span>
    )}
  </RadixDropdown.Item>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

// ─── DropdownMenu.CheckboxItem ────────────────────────────────────────────────

export type DropdownMenuCheckboxItemProps =
  React.ComponentPropsWithoutRef<typeof RadixDropdown.CheckboxItem>;

export const DropdownMenuCheckboxItem = forwardRef<
  React.ElementRef<typeof RadixDropdown.CheckboxItem>,
  DropdownMenuCheckboxItemProps
>(({ className, children, checked, ...props }, ref) => (
  <RadixDropdown.CheckboxItem
    ref={ref}
    className={cn(
      itemVariants({ variant: "default" }),
      "pr-3",
      className
    )}
    checked={checked}
    {...props}
  >
    {/* Checkbox indicator slot */}
    <span className="w-4 h-4 flex items-center justify-center shrink-0">
      <RadixDropdown.ItemIndicator>
        <Check size={12} className="text-[#FF2D55]" />
      </RadixDropdown.ItemIndicator>
    </span>
    <span className="flex-1 truncate">{children}</span>
  </RadixDropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";

// ─── DropdownMenu.RadioItem ───────────────────────────────────────────────────

export type DropdownMenuRadioItemProps =
  React.ComponentPropsWithoutRef<typeof RadixDropdown.RadioItem>;

export const DropdownMenuRadioItem = forwardRef<
  React.ElementRef<typeof RadixDropdown.RadioItem>,
  DropdownMenuRadioItemProps
>(({ className, children, ...props }, ref) => (
  <RadixDropdown.RadioItem
    ref={ref}
    className={cn(itemVariants({ variant: "default" }), className)}
    {...props}
  >
    <span className="w-4 h-4 flex items-center justify-center shrink-0">
      <RadixDropdown.ItemIndicator>
        <Circle size={6} className="text-[#FF2D55] fill-[#FF2D55]" />
      </RadixDropdown.ItemIndicator>
    </span>
    <span className="flex-1 truncate">{children}</span>
  </RadixDropdown.RadioItem>
));
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem";

// ─── DropdownMenu.Label ───────────────────────────────────────────────────────

export interface DropdownMenuLabelProps
  extends React.ComponentPropsWithoutRef<typeof RadixDropdown.Label> {
  inset?: boolean;
}

export const DropdownMenuLabel = forwardRef<
  React.ElementRef<typeof RadixDropdown.Label>,
  DropdownMenuLabelProps
>(({ className, inset, ...props }, ref) => (
  <RadixDropdown.Label
    ref={ref}
    className={cn(
      "px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#55556A]",
      inset && "pl-9",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

// ─── DropdownMenu.Separator ───────────────────────────────────────────────────

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <RadixDropdown.Separator
      className={cn("my-1 mx-0 h-px bg-white/[0.06]", className)}
    />
  );
}
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// ─── DropdownMenu.Sub ─────────────────────────────────────────────────────────

// Sub-menus open inline via Radix; we don't need a custom open context here
// because Radix manages sub-menu state internally and it never unmounts to exit-animate.

export interface DropdownMenuSubTriggerProps
  extends React.ComponentPropsWithoutRef<typeof RadixDropdown.SubTrigger> {
  icon?: React.ReactNode;
}

export const DropdownMenuSubTrigger = forwardRef<
  React.ElementRef<typeof RadixDropdown.SubTrigger>,
  DropdownMenuSubTriggerProps
>(({ className, icon, children, ...props }, ref) => (
  <RadixDropdown.SubTrigger
    ref={ref}
    className={cn(
      itemVariants({ variant: "default" }),
      "data-[state=open]:bg-white/[0.06] data-[state=open]:text-[#F0F0F8]",
      className
    )}
    {...props}
  >
    {icon && (
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#8888AA]">
        {icon}
      </span>
    )}
    <span className="flex-1 truncate">{children}</span>
    <ChevronRight size={13} className="ml-auto text-[#55556A] shrink-0" />
  </RadixDropdown.SubTrigger>
));
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

export const DropdownMenuSubContent = forwardRef<
  React.ElementRef<typeof RadixDropdown.SubContent>,
  React.ComponentPropsWithoutRef<typeof RadixDropdown.SubContent>
>(({ className, children, sideOffset = 4, alignOffset = -6, ...props }, ref) => (
  <RadixDropdown.Portal>
    <RadixDropdown.SubContent
      ref={ref}
      sideOffset={sideOffset}
      alignOffset={alignOffset}
      {...props}
      className={cn(
        zLayerTw("nestedOverlay"),
        "min-w-[160px] rounded-xl border border-white/[0.10]",
        "bg-[#1C1C2A]",
        "shadow-[0_16px_60px_rgba(0,0,0,0.55)]",
        "backdrop-blur-xl",
        "py-1 overflow-hidden outline-none",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
    >
      {children}
    </RadixDropdown.SubContent>
  </RadixDropdown.Portal>
));
DropdownMenuSubContent.displayName = "DropdownMenuSubContent";

// ─── Compound export ──────────────────────────────────────────────────────────

/**
 * DropdownMenu — enterprise action menu for cards, rows, and triggers.
 *
 * @example
 * <DropdownMenu>
 *   <DropdownMenu.Trigger asChild>
 *     <Button size="icon-sm" intent="ghost"><MoreHorizontal size={14} /></Button>
 *   </DropdownMenu.Trigger>
 *   <DropdownMenu.Content align="end">
 *     <DropdownMenu.Label>Actions</DropdownMenu.Label>
 *     <DropdownMenu.Item icon={<Eye size={13} />}>View details</DropdownMenu.Item>
 *     <DropdownMenu.Item icon={<Pencil size={13} />}>Edit</DropdownMenu.Item>
 *     <DropdownMenu.Separator />
 *     <DropdownMenu.Item icon={<Trash2 size={13} />} variant="destructive">Delete</DropdownMenu.Item>
 *   </DropdownMenu.Content>
 * </DropdownMenu>
 */
export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger:       DropdownMenuTrigger,
  Content:       DropdownMenuContent,
  Item:          DropdownMenuItem,
  CheckboxItem:  DropdownMenuCheckboxItem,
  RadioItem:     DropdownMenuRadioItem,
  RadioGroup:    DropdownMenuRadioGroup,
  Label:         DropdownMenuLabel,
  Separator:     DropdownMenuSeparator,
  Group:         DropdownMenuGroup,
  Sub:           DropdownMenuSub,
  SubTrigger:    DropdownMenuSubTrigger,
  SubContent:    DropdownMenuSubContent,
  Portal:        DropdownMenuPortal,
});
