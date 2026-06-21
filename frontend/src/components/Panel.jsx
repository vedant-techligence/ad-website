function Panel({ title, eyebrow, description, action, children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur ${className}`}>
      {(title || eyebrow || action) && (
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            {eyebrow ? (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                {eyebrow}
              </p>
            ) : null}
            {title ? <h3 className="mt-2 font-display text-2xl text-slate-900">{title}</h3> : null}
            {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export default Panel;
