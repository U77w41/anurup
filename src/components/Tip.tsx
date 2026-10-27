import type { FocusEvent, ReactElement, ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Only keyboard focus should open a tooltip. Focus that a menu or dialog moves back
 * to a button after a mouse click would otherwise pop the tooltip up unasked.
 */
function keyboardFocusOnly(e: FocusEvent<HTMLElement>) {
  try {
    if (!e.currentTarget.matches(":focus-visible")) e.preventDefault();
  } catch {
    // Very old browsers without :focus-visible: keep the default behaviour.
  }
}

/**
 * Hover (and keyboard focus) label for a link, button or icon.
 * The child must accept a ref: a DOM element, a <Link> or a shadcn <Button>.
 */
export function Tip({ label, children, side = "top" }: { label: ReactNode; children: ReactElement; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild onFocus={keyboardFocusOnly}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-[260px] text-xs leading-snug">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
