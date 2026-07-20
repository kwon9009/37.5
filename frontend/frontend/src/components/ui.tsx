import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost" | "danger" | "muted"
  size?: "md" | "lg"
}

export function Button({ variant = "primary", size = "lg", className, ...props }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.99]",
    outline: "border border-border bg-card text-foreground hover:bg-muted",
    ghost: "bg-transparent text-primary hover:bg-muted",
    danger: "bg-danger text-danger-foreground hover:bg-danger/90 active:scale-[0.99]",
    muted: "bg-muted text-muted-foreground hover:bg-muted/70",
  }
  const sizes: Record<string, string> = {
    md: "h-11 px-4 text-sm",
    lg: "h-14 px-5 text-base",
  }
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl font-semibold transition disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function Field({ label, className, id, ...props }: FieldProps) {
  return (
    <label htmlFor={id} className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-muted-foreground">{label}</span>}
      <input
        id={id}
        className={cn(
          "h-13 w-full rounded-2xl border border-input bg-card px-4 text-base text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-ring focus:ring-2 focus:ring-ring/20",
          className,
        )}
        {...props}
      />
    </label>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card p-5 shadow-sm", className)}>{children}</div>
  )
}
