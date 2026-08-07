import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="break-words text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="break-words text-sm text-text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
