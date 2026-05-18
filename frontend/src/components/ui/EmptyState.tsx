interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = "inbox", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl bg-surface py-16 ring-1 ring-outline-variant">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/40">{icon}</span>
      <div className="text-center">
        <p className="font-semibold text-on-surface">{title}</p>
        {description && <p className="mt-1 text-body-sm text-on-surface-variant">{description}</p>}
      </div>
      {action}
    </div>
  );
}
