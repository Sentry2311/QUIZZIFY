export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon ? (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300">
          <Icon className="h-7 w-7" />
        </span>
      ) : null}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-ink-500 dark:text-ink-300">{description}</p> : null}
      {action}
    </div>
  );
}
