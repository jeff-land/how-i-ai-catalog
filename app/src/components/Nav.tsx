import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-[var(--color-foreground)]">
            How I AI
          </span>
          <span className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-accent)]">
            Catalog
          </span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
          >
            Episodes
          </Link>
          <Link
            href="/use-cases"
            className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
          >
            Use Cases
          </Link>
        </div>
      </div>
    </nav>
  );
}
