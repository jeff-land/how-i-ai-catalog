"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { UseCaseFlat } from "@/lib/types";
import SearchBar from "./SearchBar";
import RolePicker from "./RolePicker";

const CATEGORY_LABELS: Record<string, string> = {
  coding: "Software Development",
  writing: "Writing & Documents",
  design: "Design & Prototyping",
  automation: "Workflow Automation",
  "data-analysis": "Data & Analytics",
  productivity: "Productivity & Efficiency",
  hiring: "Hiring & Recruiting",
  marketing: "Marketing & Growth",
  research: "Research & Discovery",
  "customer-support": "Customer Support",
  sales: "Sales & Revenue",
  operations: "Operations & Process",
  strategy: "Strategy & Planning",
  finance: "Finance & Accounting",
  learning: "Learning & Development",
  communication: "Communication & Meetings",
  "project-management": "Project Management",
  "product-management": "Product Management",
  "content-creation": "Content Creation",
  personal: "Personal & Side Projects",
  leadership: "Leadership",
  networking: "Networking",
  other: "Other",
};

function formatCategory(cat: string): string {
  return CATEGORY_LABELS[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, " ");
}

const INTENT_CONFIG: { id: string; label: string; description: string }[] = [
  { id: "ship-faster", label: "Ship faster", description: "Get real work done more efficiently" },
  { id: "automate", label: "Automate the boring stuff", description: "Eliminate tedious, repetitive work" },
  { id: "tinker", label: "Tinker on something", description: "Personal projects & creative exploration" },
  { id: "get-inspired", label: "Get inspired", description: "Novel ideas you didn't know were possible" },
  { id: "level-up", label: "Level up my skills", description: "Learn, grow, get better at your craft" },
  { id: "think-strategically", label: "Think more strategically", description: "Planning & decision-making" },
];

interface HomeClientProps {
  useCases: UseCaseFlat[];
  allAudiences: string[];
  totalEpisodes: number;
  totalTools: number;
}

export default function HomeClient({
  useCases,
  allAudiences,
  totalEpisodes,
  totalTools,
}: HomeClientProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [surpriseUseCase, setSurpriseUseCase] = useState<UseCaseFlat | null>(null);
  const [showAllPicks, setShowAllPicks] = useState(false);

  // All picks
  const picks = useMemo(() => useCases.filter((uc) => uc.is_pick), [useCases]);

  // Filter use cases
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return useCases.filter((uc) => {
      // Role filter
      if (selectedRole) {
        if (uc.audience !== selectedRole && uc.audience !== "everyone") return false;
      }
      // Intent filter
      if (selectedIntent) {
        if (!uc.intents?.includes(selectedIntent)) return false;
      }
      // Text search
      if (q) {
        const searchable = [
          uc.title,
          uc.one_liner,
          uc.description,
          uc.guest_name,
          uc.episode_title,
          ...(uc.tools || []),
          uc.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [useCases, search, selectedRole, selectedIntent]);

  // Filtered picks (respect role + intent + search)
  const filteredPicks = useMemo(() => {
    return filtered.filter((uc) => uc.is_pick);
  }, [filtered]);

  // Group by category, sorted by count
  const grouped = useMemo(() => {
    const groups: Record<string, UseCaseFlat[]> = {};
    for (const uc of filtered) {
      const cat = uc.category || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(uc);
    }
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // Total category count
  const totalCategories = useMemo(() => {
    const cats = new Set(useCases.map((uc) => uc.category));
    return cats.size;
  }, [useCases]);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const handleSurpriseMe = useCallback(() => {
    const pool = filtered.length > 0 ? filtered : useCases;
    const random = pool[Math.floor(Math.random() * pool.length)];
    setSurpriseUseCase(random);
  }, [filtered, useCases]);

  const hasActiveFilters = selectedRole || selectedIntent || search;

  const CARDS_PER_CATEGORY = 6;
  const PICKS_INITIAL = 6;

  return (
    <div className="space-y-10">
      {/* Hero section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-5xl">
          What will you build with AI?
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-[var(--color-muted)]">
          {useCases.length} real use cases from {totalEpisodes} episodes of How I AI.
          Browse by role, search by keyword, or let us surprise you.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-center">
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{useCases.length}</p>
          <p className="text-xs text-[var(--color-muted)]">Use Cases</p>
        </div>
        <div className="h-8 w-px bg-[var(--color-border)]" />
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{totalEpisodes}</p>
          <p className="text-xs text-[var(--color-muted)]">Episodes</p>
        </div>
        <div className="h-8 w-px bg-[var(--color-border)]" />
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{totalCategories}</p>
          <p className="text-xs text-[var(--color-muted)]">Categories</p>
        </div>
        <div className="h-8 w-px bg-[var(--color-border)]" />
        <div>
          <p className="text-2xl font-bold text-[var(--color-accent)]">{totalTools}+</p>
          <p className="text-xs text-[var(--color-muted)]">Tools</p>
        </div>
      </div>

      {/* Role picker */}
      <div className="text-center">
        <p className="mb-3 text-sm font-medium text-[var(--color-muted)]">
          What kind of work do you do?
        </p>
        <RolePicker
          roles={allAudiences.filter((a) => a !== "everyone")}
          selected={selectedRole}
          onChange={setSelectedRole}
          variant="hero"
        />
        {selectedRole && (
          <button
            onClick={() => setSelectedRole(null)}
            className="mt-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Show all roles
          </button>
        )}
      </div>

      {/* Intent picker */}
      <div className="text-center">
        <p className="mb-3 text-sm font-medium text-[var(--color-muted)]">
          I want to...
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {INTENT_CONFIG.map((intent) => {
            const isActive = selectedIntent === intent.id;
            return (
              <button
                key={intent.id}
                onClick={() => setSelectedIntent(isActive ? null : intent.id)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--color-foreground)] text-[var(--color-background)] shadow-md scale-105"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-foreground)] hover:text-[var(--color-foreground)] hover:shadow-sm"
                }`}
                title={intent.description}
              >
                {intent.label}
              </button>
            );
          })}
        </div>
        {selectedIntent && (
          <button
            onClick={() => setSelectedIntent(null)}
            className="mt-3 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Show all goals
          </button>
        )}
      </div>

      {/* Search + Surprise me */}
      <div className="mx-auto flex max-w-2xl items-center gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search use cases, tools, guests..."
          />
        </div>
        <button
          onClick={handleSurpriseMe}
          className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-muted)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:shadow-sm"
        >
          Surprise me
        </button>
      </div>

      {/* Surprise me result */}
      {surpriseUseCase && (
        <div className="mx-auto max-w-2xl">
          <div className="relative rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-5">
            <button
              onClick={() => setSurpriseUseCase(null)}
              className="absolute right-3 top-3 text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-accent)]">
              Random pick
            </p>
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {surpriseUseCase.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {surpriseUseCase.one_liner || surpriseUseCase.description}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {surpriseUseCase.tools?.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
                >
                  {tool}
                </span>
              ))}
              <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
                {formatCategory(surpriseUseCase.category)}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href={`/episodes/${surpriseUseCase.episode_id}`}
                className="text-xs font-medium text-[var(--color-accent)] hover:underline"
              >
                View episode
              </Link>
              <button
                onClick={handleSurpriseMe}
                className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-accent)]"
              >
                Try another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status line */}
      <div className="text-center text-sm text-[var(--color-muted)]">
        {filtered.length === useCases.length
          ? `Showing all ${useCases.length} use cases across ${grouped.length} categories`
          : `${filtered.length} use cases across ${grouped.length} categories`}
        {selectedRole && (
          <span> for <span className="font-medium text-[var(--color-foreground)]">{selectedRole.replace(/-/g, " ")}</span></span>
        )}
        {selectedIntent && (
          <span> to <span className="font-medium text-[var(--color-foreground)]">{INTENT_CONFIG.find(i => i.id === selectedIntent)?.label.toLowerCase()}</span></span>
        )}
        {search && (
          <span> matching &ldquo;<span className="font-medium text-[var(--color-foreground)]">{search}</span>&rdquo;</span>
        )}
        {hasActiveFilters && (
          <>
            {" "}
            <button
              onClick={() => {
                setSearch("");
                setSelectedRole(null);
                setSelectedIntent(null);
              }}
              className="text-[var(--color-accent)] hover:underline"
            >
              Clear filters
            </button>
          </>
        )}
      </div>

      {/* Claude's Picks */}
      {filteredPicks.length > 0 && (
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                Claude&rsquo;s Picks
              </h2>
              <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
                {filteredPicks.length}
              </span>
            </div>
            <span className="text-sm text-[var(--color-muted)]">
              The most useful, surprising, and creative use cases
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(showAllPicks ? filteredPicks : filteredPicks.slice(0, PICKS_INITIAL)).map((uc, i) => (
              <PickCard key={`pick-${uc.episode_id}-${i}`} useCase={uc} />
            ))}
          </div>
          {filteredPicks.length > PICKS_INITIAL && (
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowAllPicks(!showAllPicks)}
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                {showAllPicks
                  ? "Show fewer picks"
                  : `Show all ${filteredPicks.length} picks`}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Category sections */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-muted)]">
            No use cases match your filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedRole(null);
              setSelectedIntent(null);
            }}
            className="mt-3 text-sm font-medium text-[var(--color-accent)] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([category, categoryUseCases]) => {
            const isExpanded = expandedCategories.has(category);
            const visibleCount = isExpanded ? categoryUseCases.length : CARDS_PER_CATEGORY;
            const visible = categoryUseCases.slice(0, visibleCount);
            const hasMore = categoryUseCases.length > CARDS_PER_CATEGORY;

            return (
              <section key={category}>
                {/* Category header */}
                <div className="mb-4 flex items-baseline justify-between">
                  <h2 className="text-xl font-bold text-[var(--color-foreground)]">
                    {formatCategory(category)}
                  </h2>
                  <span className="text-sm text-[var(--color-muted)]">
                    {categoryUseCases.length} use case{categoryUseCases.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Use case cards grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visible.map((uc, i) => (
                    <UseCaseCard key={`${uc.episode_id}-${i}`} useCase={uc} />
                  ))}
                </div>

                {/* Show more / less */}
                {hasMore && (
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="text-sm font-medium text-[var(--color-accent)] hover:underline"
                    >
                      {isExpanded
                        ? "Show fewer"
                        : `Show all ${categoryUseCases.length} use cases`}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PickCard({ useCase }: { useCase: UseCaseFlat }) {
  return (
    <Link
      href={`/episodes/${useCase.episode_id}`}
      className="group relative flex flex-col rounded-xl border-2 border-[var(--color-accent)]/30 bg-[var(--color-surface)] p-4 transition-all hover:border-[var(--color-accent)] hover:shadow-md"
    >
      {/* Pick badge */}
      <span className="absolute -top-2 right-3 rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-[10px] font-semibold text-white">
        Pick
      </span>

      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] line-clamp-2">
        {useCase.title}
      </h3>

      {/* Pick reason */}
      {useCase.pick_reason && (
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-accent)]/80 italic line-clamp-2">
          {useCase.pick_reason}
        </p>
      )}

      {/* One-liner */}
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-2">
        {useCase.one_liner || useCase.description}
      </p>

      {/* Tools */}
      <div className="mt-auto flex flex-wrap gap-1 pt-3">
        {useCase.tools?.slice(0, 3).map((tool) => (
          <span
            key={tool}
            className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
          >
            {tool}
          </span>
        ))}
        {(useCase.tools?.length || 0) > 3 && (
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
            +{(useCase.tools?.length || 0) - 3}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
        {useCase.guest_name && (
          <span className="truncate">{useCase.guest_name}</span>
        )}
        {useCase.guest_name && <span>·</span>}
        <span>{formatCategory(useCase.category)}</span>
      </div>
    </Link>
  );
}

function UseCaseCard({ useCase }: { useCase: UseCaseFlat }) {
  return (
    <Link
      href={`/episodes/${useCase.episode_id}`}
      className={`group flex flex-col rounded-xl border bg-[var(--color-surface)] p-4 transition-all hover:shadow-md ${
        useCase.is_pick
          ? "border-[var(--color-accent)]/30 hover:border-[var(--color-accent)]"
          : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
      }`}
    >
      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-accent)] line-clamp-2">
        {useCase.is_pick && (
          <span className="mr-1.5 inline-block rounded bg-[var(--color-accent)] px-1 py-0.5 text-[9px] font-bold text-white align-middle">
            PICK
          </span>
        )}
        {useCase.title}
      </h3>

      {/* One-liner or description */}
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)] line-clamp-2">
        {useCase.one_liner || useCase.description}
      </p>

      {/* Tools */}
      <div className="mt-auto flex flex-wrap gap-1 pt-3">
        {useCase.tools?.slice(0, 3).map((tool) => (
          <span
            key={tool}
            className="rounded-full bg-[var(--color-accent-light)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]"
          >
            {tool}
          </span>
        ))}
        {(useCase.tools?.length || 0) > 3 && (
          <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">
            +{(useCase.tools?.length || 0) - 3}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
        {useCase.guest_name && (
          <span className="truncate">{useCase.guest_name}</span>
        )}
        {useCase.guest_name && <span>·</span>}
        <span className="capitalize">{useCase.difficulty}</span>
      </div>
    </Link>
  );
}
