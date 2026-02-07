#!/usr/bin/env python3
"""
enrich.py — Second-pass enrichment of use cases with intent tags and Claude's Picks.

Reads data/use-cases.json, sends batches to Claude for lightweight classification,
and writes the enriched data back.

Usage:
    ANTHROPIC_API_KEY=sk-... python scripts/enrich.py

    Pass --force to re-enrich use cases that already have intents assigned.
"""

import json
import os
import sys
import time
from typing import List, Dict, Any

import anthropic

USE_CASES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "use-cases.json")
MODEL = "claude-sonnet-4-20250514"
DELAY_SECONDS = 1
BATCH_SIZE = 50

INTENTS = [
    "ship-faster",
    "automate",
    "tinker",
    "get-inspired",
    "level-up",
    "think-strategically",
]

SYSTEM_PROMPT = """You are an expert curator of AI use cases. You will be given a batch of AI use cases extracted from the "How I AI" podcast. Your job is two-fold:

1. **Assign 1-2 intent tags** to each use case from this fixed set:
   - "ship-faster" — helps people get real work done more efficiently
   - "automate" — eliminates tedious, repetitive work
   - "tinker" — personal projects, side quests, creative exploration
   - "get-inspired" — novel, surprising, "I didn't know you could do that" ideas
   - "level-up" — learning, growing, getting better at your craft
   - "think-strategically" — planning, decision-making, seeing the big picture

2. **Flag the standout picks** — use cases that are especially useful, surprising, creative, or broadly applicable. Across ALL batches combined, we want roughly 25-30 total picks out of ~375 use cases, so flag about 3-4 per batch of 50. For each pick, write a short (1 sentence) reason explaining why it stands out.

Be thoughtful about intent assignment. A use case can have 1 or 2 intents, but every use case must have at least 1. Choose the most fitting — don't default to "ship-faster" for everything."""

ENRICHMENT_PROMPT = """Here is a batch of use cases. For each one, return a JSON array with one object per use case, in the same order.

Each object should have:
- "index": the use case's index number (as provided)
- "intents": array of 1-2 intent tags from the allowed set
- "is_pick": boolean — true only for the ~3-4 most standout use cases in this batch
- "pick_reason": a short sentence explaining why this stands out (null if is_pick is false)

Return ONLY a valid JSON array, no markdown fencing, no explanation.

ALLOWED INTENTS: "ship-faster", "automate", "tinker", "get-inspired", "level-up", "think-strategically"

USE CASES:
"""


def format_batch(use_cases: List[Dict[str, Any]], start_idx: int) -> str:
    """Format a batch of use cases for the prompt."""
    lines = []
    for i, uc in enumerate(use_cases):
        idx = start_idx + i
        lines.append(
            "[%d] %s | %s | Category: %s | Audience: %s | Tools: %s"
            % (
                idx,
                uc.get("title", ""),
                uc.get("one_liner") or uc.get("description", "")[:120],
                uc.get("category", ""),
                uc.get("audience", ""),
                ", ".join((uc.get("tools") or [])[:5]),
            )
        )
    return "\n".join(lines)


def enrich_batch(
    client: anthropic.Anthropic,
    use_cases: List[Dict[str, Any]],
    start_idx: int,
) -> List[Dict[str, Any]]:
    """Send a batch to Claude and get enrichment data back."""
    batch_text = format_batch(use_cases, start_idx)

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": ENRICHMENT_PROMPT + batch_text}
            ],
        )

        text = response.content[0].text.strip()

        # Remove markdown fencing if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        results = json.loads(text)
        return results

    except json.JSONDecodeError as e:
        print("  JSON parse error: %s" % e)
        print("  Raw response: %s..." % text[:300])
        return []
    except anthropic.APIError as e:
        print("  API error: %s" % e)
        return []
    except Exception as e:
        print("  Unexpected error: %s" % e)
        return []


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable.")
        sys.exit(1)

    force = "--force" in sys.argv
    client = anthropic.Anthropic(api_key=api_key)

    # Load use cases
    if not os.path.exists(USE_CASES_PATH):
        print("ERROR: %s not found. Run analyze.py first." % USE_CASES_PATH)
        sys.exit(1)

    with open(USE_CASES_PATH, "r", encoding="utf-8") as f:
        use_cases = json.load(f)

    print("Loaded %d use cases." % len(use_cases))

    # Check if already enriched
    already_enriched = sum(1 for uc in use_cases if uc.get("intents"))
    if already_enriched > 0 and not force:
        print(
            "%d use cases already enriched. Use --force to re-enrich."
            % already_enriched
        )
        if already_enriched == len(use_cases):
            print("All use cases already enriched. Nothing to do.")
            return

    # Process in batches
    total_batches = (len(use_cases) + BATCH_SIZE - 1) // BATCH_SIZE
    pick_count = 0
    success_count = 0

    for batch_num in range(total_batches):
        start = batch_num * BATCH_SIZE
        end = min(start + BATCH_SIZE, len(use_cases))
        batch = use_cases[start:end]

        # Skip already-enriched unless forcing
        if not force and all(uc.get("intents") for uc in batch):
            print(
                "[Batch %d/%d] Skipping — already enriched."
                % (batch_num + 1, total_batches)
            )
            continue

        print(
            "[Batch %d/%d] Enriching use cases %d-%d..."
            % (batch_num + 1, total_batches, start, end - 1)
        )

        results = enrich_batch(client, batch, start)

        if not results:
            print("  Failed — skipping batch.")
            continue

        # Apply results
        for r in results:
            idx = r.get("index")
            if idx is None or idx < 0 or idx >= len(use_cases):
                continue

            intents = r.get("intents", [])
            # Validate intents
            valid_intents = [i for i in intents if i in INTENTS]
            if not valid_intents:
                valid_intents = ["get-inspired"]  # Fallback

            use_cases[idx]["intents"] = valid_intents
            use_cases[idx]["is_pick"] = bool(r.get("is_pick", False))
            use_cases[idx]["pick_reason"] = (
                r.get("pick_reason") if r.get("is_pick") else None
            )

            success_count += 1
            if use_cases[idx]["is_pick"]:
                pick_count += 1

        # Save after each batch
        with open(USE_CASES_PATH, "w", encoding="utf-8") as f:
            json.dump(use_cases, f, indent=2, ensure_ascii=False)

        if batch_num < total_batches - 1:
            time.sleep(DELAY_SECONDS)

    # Summary
    intent_counts = {}
    for uc in use_cases:
        for intent in uc.get("intents", []):
            intent_counts[intent] = intent_counts.get(intent, 0) + 1

    print("\nDone! Enriched %d use cases, %d picks." % (success_count, pick_count))
    print("\nIntent distribution:")
    for intent, count in sorted(intent_counts.items(), key=lambda x: -x[1]):
        print("  %-25s %d" % (intent, count))
    print("\nSaved to: %s" % os.path.abspath(USE_CASES_PATH))


if __name__ == "__main__":
    main()
