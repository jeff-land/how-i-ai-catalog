"use client";

interface TagFilterProps {
  tags: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export default function TagFilter({
  tags,
  selected,
  onChange,
  label,
}: TagFilterProps) {
  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  if (tags.length === 0) return null;

  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const isActive = selected.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
