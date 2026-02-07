"use client";

import { useState } from "react";

interface TranscriptToggleProps {
  transcript: string;
}

export default function TranscriptToggle({ transcript }: TranscriptToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--color-accent)]"
      >
        <h2 className="text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
          Full Transcript
        </h2>
        <svg
          className={`h-4 w-4 text-[var(--color-muted)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 max-h-[600px] overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
            {transcript}
          </p>
        </div>
      )}
    </section>
  );
}
