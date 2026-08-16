export type TabItem = { key: string; label: string };

export function Tabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (key: string) => void }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-2 border-b border-border-subtle pb-3">
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            className={`flex h-9 items-center rounded-full px-3.5 text-sm font-medium transition duration-150 ${
              isActive ? "bg-brand text-brand-foreground" : "bg-surface-muted text-text-secondary hover:bg-border-subtle"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
