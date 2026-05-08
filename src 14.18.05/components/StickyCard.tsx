import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = HTMLAttributes<HTMLDivElement> & {
  tilt?: "a" | "b" | "none";
  tone?: "exp" | "thought" | "bug" | "win" | "idea" | "bg";
  children: ReactNode;
};

export const StickyCard = forwardRef<HTMLDivElement, Props>(function StickyCard(
  { tilt = "a", tone = "bg", className, children, style, ...rest },
  ref,
) {
  const toneVar =
    tone === "bg"
      ? "var(--bg)"
      : tone === "exp"
        ? "var(--exp)"
        : tone === "thought"
          ? "var(--thought)"
          : tone === "bug"
            ? "var(--bug)"
            : tone === "win"
              ? "var(--win)"
              : "var(--idea)";
  const tiltClass = tilt === "a" ? "tilt-a" : tilt === "b" ? "tilt-b" : "";
  return (
    <div
      ref={ref}
      className={cn("sticky-card p-4", tiltClass, className)}
      style={{ background: toneVar, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
});
