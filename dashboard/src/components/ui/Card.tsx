import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  onClick?: () => void;
}

const paddingMap = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function Card({ children, className = "", padding = "md", hover = false, onClick }: CardProps) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={[
        "rounded-[10px]",
        paddingMap[padding],
        hover ? "transition-colors cursor-pointer hover:bg-[var(--bg-hover)]" : "",
        onClick ? "cursor-pointer" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, action, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <h3 className="font-medium text-[13px]" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      {action}
    </div>
  );
}
