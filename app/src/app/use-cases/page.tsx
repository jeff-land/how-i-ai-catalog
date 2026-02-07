import { getUseCases, getAllCategories } from "@/lib/data";
import UseCasesClient from "@/components/UseCasesClient";

export default function UseCasesPage() {
  const useCases = getUseCases();
  const allCategories = getAllCategories(useCases);

  // Extract unique difficulties and audiences
  const allDifficulties = Array.from(
    new Set(useCases.map((uc) => uc.difficulty).filter(Boolean))
  ).sort();
  const allAudiences = Array.from(
    new Set(useCases.map((uc) => uc.audience).filter(Boolean))
  ).sort();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
          AI Use Cases
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          Every actionable workflow extracted from across all episodes. Filter by
          category, difficulty, or audience.
        </p>
      </div>

      <UseCasesClient
        useCases={useCases}
        allCategories={allCategories}
        allDifficulties={allDifficulties}
        allAudiences={allAudiences}
      />
    </div>
  );
}
