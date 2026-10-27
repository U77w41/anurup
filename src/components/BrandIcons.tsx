import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number };

/** Two hands holding a heart, for the "Support my work" link. Drawn in the current text colour. */
export function SupportIcon({ className, strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("h-6 w-6", className)} {...props}>
      <path
        className="transition-[fill] group-hover:fill-[var(--tag-pdf)]"
        d="M16 6.27975C16 6.88118 15.7625 7.45883 15.3383 7.88611C14.3619 8.87007 13.415 9.89605 12.4021 10.8443C12.17 11.0585 11.8017 11.0507 11.5795 10.8268L8.6615 7.88611C7.7795 6.99725 7.7795 5.56225 8.6615 4.67339C9.55218 3.77579 11.0032 3.77579 11.8938 4.67339L11.9999 4.78027L12.1059 4.67345C12.533 4.24286 13.1146 4 13.7221 4C14.3297 4 14.9113 4.24284 15.3383 4.67339C15.7625 5.10073 16 5.67835 16 6.27975Z"
      />
      <path d="M18 20L21.8243 16.1757C21.9368 16.0632 22 15.9106 22 15.7515V10.5C22 9.67157 21.3284 9 20.5 9V9C19.6716 9 19 9.67157 19 10.5V15" />
      <path d="M18 16L18.8581 15.1419C18.949 15.051 19 14.9278 19 14.7994V14.7994C19 14.6159 18.8963 14.4482 18.7322 14.3661L18.2893 14.1447C17.5194 13.7597 16.5894 13.9106 15.9807 14.5193L15.0858 15.4142C14.7107 15.7893 14.5 16.298 14.5 16.8284V20" />
      <path d="M6 20L2.17574 16.1757C2.06321 16.0632 2 15.9106 2 15.7515V10.5C2 9.67157 2.67157 9 3.5 9V9C4.32843 9 5 9.67157 5 10.5V15" />
      <path d="M6 16L5.14187 15.1419C5.05103 15.051 5 14.9278 5 14.7994V14.7994C5 14.6159 5.10366 14.4482 5.26776 14.3661L5.71067 14.1447C6.48064 13.7597 7.41059 13.9106 8.01931 14.5193L8.91421 15.4142C9.28929 15.7893 9.5 16.298 9.5 16.8284V20" />
    </svg>
  );
}

/**
 * Mark of Ujjwal's portfolio and blog. The original is drawn on a 1000×1000 canvas;
 * the view box is cropped to the drawing and the stroke scaled so it lines up with
 * the 24 px Lucide icons next to it.
 */
export function BlogIcon({ className, strokeWidth = 1.5, ...props }: IconProps) {
  const VIEW = 900;
  return (
    <svg viewBox={`58 45 ${VIEW} ${VIEW}`} fill="none" stroke="currentColor" strokeWidth={(strokeWidth * VIEW) / 24} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={cn("h-6 w-6", className)} {...props}>
      <path d="M 652 278 C 555 278, 468 242, 468 192 C 468 142, 530 118, 598 118 C 675 118, 735 148, 730 176 C 727 190, 715 198, 702 198" />
      <path d="M 413 348 Q 645 338, 880 340" />
      <path d="M 500 344 C 630 346, 766 368, 766 408 C 766 445, 520 500, 520 535 C 520 568, 764 575, 764 668 C 764 765, 560 822, 390 822 C 220 822, 136 778, 136 720 C 136 672, 205 656, 305 656 C 475 656, 635 745, 674 872" />
    </svg>
  );
}
