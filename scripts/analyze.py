#!/usr/bin/env python3
"""
analyze.py — Analyze episode transcripts using the Claude API.

Reads data/episodes.json, sends each transcript to Claude for structured extraction,
and writes data/episodes-analyzed.json and data/use-cases.json.

Usage:
    ANTHROPIC_API_KEY=sk-... python scripts/analyze.py

    Or set the env var in your shell profile.
"""

import json
import os
import sys
import time
from typing import Optional

import anthropic

INPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "episodes.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "episodes-analyzed.json")
USE_CASES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "use-cases.json")

MODEL = "claude-sonnet-4-20250514"
DELAY_SECONDS = 1  # Between API calls

SYSTEM_PROMPT = """You are an expert analyst for AI workflows and use cases. 
You will be given a podcast transcript from "How I AI", a show where guests share practical AI workflows.
Extract structured information from the transcript."""

EXTRACTION_PROMPT = """Analyze this podcast content and extract the following information as JSON.

Return ONLY valid JSON with this exact structure:
{
  "guest_name": "Full Name",
  "guest_role": "Title at Company",
  "summary": "2-3 sentence summary of the episode",
  "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"],
  "use_cases": [
    {
      "title": "Short descriptive title of the workflow/use case",
      "description": "1-2 sentence description of what the workflow does",
      "tools": ["Tool1", "Tool2"],
      "category": "one of: coding, writing, design, automation, data-analysis, productivity, hiring, marketing, research, personal, other",
      "audience": "one of: engineers, product-managers, designers, executives, marketers, everyone, non-technical",
      "difficulty": "one of: beginner, intermediate, advanced"
    }
  ],
  "tools_mentioned": ["Tool1", "Tool2", "Tool3"],
  "notable_quotes": ["A short impactful quote from the episode"]
}

Rules:
- Extract ALL distinct use cases / workflows discussed, not just the main one
- Be specific in use case titles — "Automate CRM updates with Claude + Zapier" is better than "CRM automation"
- tools_mentioned should be a comprehensive list of every tool, product, or platform named
- If you cannot determine a field, use null
- Return ONLY the JSON object, no markdown fencing, no explanation

CONTENT:
"""


def analyze_episode(client, episode):
    # type: (anthropic.Anthropic, dict) -> Optional[dict]
    """Send a transcript (or description) to Claude and get structured analysis back."""
    transcript = episode.get("transcript")
    description = episode.get("description") or ""

    if not transcript and not description:
        return None

    # Build the content to analyze
    context = "Episode Title: %s\n" % episode.get("title", "Unknown")

    if transcript:
        # Truncate very long transcripts to stay within context limits
        words = transcript.split()
        if len(words) > 12000:
            transcript = " ".join(words[:12000]) + " [TRUNCATED]"
        context += "Episode Description: %s\n\n" % description[:500]
        content = context + "FULL TRANSCRIPT:\n" + transcript
    else:
        # Use the full description as the content source
        content = context + "EPISODE DESCRIPTION (no transcript available):\n" + description

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": EXTRACTION_PROMPT + content,
                }
            ],
        )

        # Extract the text content
        text = response.content[0].text.strip()

        # Remove markdown fencing if present
        if text.startswith("```"):
            text = text.split("\n", 1)[1]  # Remove first line
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()

        analysis = json.loads(text)
        return analysis

    except json.JSONDecodeError as e:
        print("  JSON parse error: %s" % e)
        print("  Raw response: %s..." % text[:200])
        return None
    except anthropic.APIError as e:
        print("  API error: %s" % e)
        return None
    except Exception as e:
        print("  Unexpected error: %s" % e)
        return None


def build_use_cases_index(episodes: list) -> list:
    """Flatten all use cases across episodes into a single searchable list."""
    use_cases = []

    for ep in episodes:
        analysis = ep.get("analysis")
        if not analysis or not analysis.get("use_cases"):
            continue

        for uc in analysis["use_cases"]:
            use_cases.append(
                {
                    "title": uc.get("title"),
                    "description": uc.get("description"),
                    "tools": uc.get("tools", []),
                    "category": uc.get("category"),
                    "audience": uc.get("audience"),
                    "difficulty": uc.get("difficulty"),
                    "episode_id": ep["id"],
                    "episode_title": ep["title"],
                    "guest_name": analysis.get("guest_name"),
                    "publish_date": ep.get("publish_date"),
                }
            )

    return use_cases


def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Set ANTHROPIC_API_KEY environment variable.")
        print("  export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Load episodes
    if not os.path.exists(INPUT_PATH):
        print("ERROR: %s not found. Run collect.py first." % INPUT_PATH)
        sys.exit(1)

    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        episodes = json.load(f)

    print("Loaded %d episodes." % len(episodes))

    # Check for existing analyzed data to allow resuming
    analyzed_ids = set()
    if os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
            for ep in existing:
                if ep.get("analysis"):
                    analyzed_ids.add(ep["id"])
                    # Merge existing analysis into current episodes
                    for e in episodes:
                        if e["id"] == ep["id"]:
                            e["analysis"] = ep["analysis"]
                            break
        print("Found %d already-analyzed episodes (will skip)." % len(analyzed_ids))

    # Analyze all episodes — those with transcripts get full analysis,
    # those with only descriptions get lighter analysis
    episodes_with_content = [e for e in episodes if e.get("transcript") or e.get("description")]
    to_analyze = [e for e in episodes_with_content if e["id"] not in analyzed_ids]
    with_transcript = sum(1 for e in to_analyze if e.get("transcript"))
    desc_only = len(to_analyze) - with_transcript
    print("%d episodes have content, %d need analysis (%d with transcript, %d description-only)." % (
        len(episodes_with_content), len(to_analyze), with_transcript, desc_only
    ))

    success_count = 0
    fail_count = 0

    for i, episode in enumerate(to_analyze):
        print("[%d/%d] Analyzing: %s..." % (i + 1, len(to_analyze), episode['title'][:60]))
        analysis = analyze_episode(client, episode)

        if analysis:
            episode["analysis"] = analysis
            success_count += 1
            uc_count = len(analysis.get("use_cases", []))
            print("  Extracted %d use cases" % uc_count)
        else:
            episode["analysis"] = None
            fail_count += 1

        # Save after each episode (allows resuming)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(episodes, f, indent=2, ensure_ascii=False)

        if i < len(to_analyze) - 1:
            time.sleep(DELAY_SECONDS)

    # Build and save use cases index
    use_cases = build_use_cases_index(episodes)
    with open(USE_CASES_PATH, "w", encoding="utf-8") as f:
        json.dump(use_cases, f, indent=2, ensure_ascii=False)

    print("\nDone! %d analyzed, %d failed." % (success_count, fail_count))
    print("Total use cases extracted: %d" % len(use_cases))
    print("Saved to:\n  %s\n  %s" % (os.path.abspath(OUTPUT_PATH), os.path.abspath(USE_CASES_PATH)))


if __name__ == "__main__":
    main()
