#!/usr/bin/env python3
"""
generate_sample_analysis.py — Create sample analysis data from episode metadata
so the web app can be tested without running the Claude API.

This uses the episode descriptions and titles to create reasonable placeholder
analysis. Run analyze.py with your ANTHROPIC_API_KEY for real analysis.
"""

import json
import os
import re

INPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "episodes.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "episodes-analyzed.json")
USE_CASES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "use-cases.json")


def extract_guest_from_title(title):
    """Try to extract guest name from episode title."""
    # Patterns like "with Guest Name" or "| Guest Name"
    patterns = [
        r"\|\s*(.+?)(?:\s*\(|$)",
        r"with\s+(.+?)(?:\s*\(|$)",
        r":\s*(.+?)'s\b",
    ]
    for p in patterns:
        m = re.search(p, title)
        if m:
            name = m.group(1).strip()
            # Filter out non-names
            if len(name.split()) <= 4 and not any(w in name.lower() for w in ["how", "what", "the", "a ", "an "]):
                return name
    return None


def extract_tools_from_description(desc):
    """Extract tool names from description text."""
    known_tools = [
        "ChatGPT", "Claude", "Claude Code", "Cursor", "Copilot", "Devin",
        "GitHub", "Zapier", "Vercel", "v0", "Replit", "Lovable",
        "Midjourney", "Sora", "Gemini", "Perplexity", "NotebookLM",
        "Notebook LM", "Google NotebookLM", "Figma", "Slack", "Linear",
        "Granola", "Coda", "Suno", "Webflow", "Next.js", "Descript",
        "Obsidian", "Codex", "GitHub Spark", "Goose", "Magic Patterns",
        "ElevenLabs", "GitHub Copilot", "MCPs", "MCP", "GPT-4", "GPT-5",
        "Grok", "HubSpot", "Jira", "Trello", "Square",
    ]
    found = []
    for tool in known_tools:
        if tool.lower() in desc.lower():
            found.append(tool)
    return list(set(found))


def guess_category(title, desc):
    """Guess category from title and description keywords."""
    text = (title + " " + desc).lower()
    if any(w in text for w in ["code", "coding", "cursor", "developer", "engineer", "git"]):
        return "coding"
    if any(w in text for w in ["design", "prototype", "figma", "ui", "ux"]):
        return "design"
    if any(w in text for w in ["automat", "zapier", "workflow", "agent"]):
        return "automation"
    if any(w in text for w in ["writ", "content", "blog", "edit"]):
        return "writing"
    if any(w in text for w in ["data", "analytics", "analy"]):
        return "data-analysis"
    if any(w in text for w in ["hiring", "recruit", "interview"]):
        return "hiring"
    if any(w in text for w in ["market", "seo", "growth"]):
        return "marketing"
    if any(w in text for w in ["research", "study"]):
        return "research"
    return "productivity"


def create_sample_analysis(episode):
    """Create a reasonable sample analysis from episode metadata."""
    title = episode.get("title", "")
    desc = episode.get("description", "")
    guest = extract_guest_from_title(title)
    tools = extract_tools_from_description(desc)
    category = guess_category(title, desc)

    # Extract first paragraph as summary
    paragraphs = [p.strip() for p in desc.split("\n\n") if p.strip()]
    summary = paragraphs[0][:300] if paragraphs else title

    # Create a single use case from the title
    use_case = {
        "title": title[:100],
        "description": summary[:200],
        "tools": tools[:5],
        "category": category,
        "audience": "everyone",
        "difficulty": "intermediate",
    }

    return {
        "guest_name": guest,
        "guest_role": None,
        "summary": summary,
        "key_takeaways": [],
        "use_cases": [use_case],
        "tools_mentioned": tools,
        "notable_quotes": [],
    }


def build_use_cases_index(episodes):
    use_cases = []
    for ep in episodes:
        analysis = ep.get("analysis")
        if not analysis or not analysis.get("use_cases"):
            continue
        for uc in analysis["use_cases"]:
            use_cases.append({
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
            })
    return use_cases


def main():
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        episodes = json.load(f)

    print("Generating sample analysis for %d episodes..." % len(episodes))

    for ep in episodes:
        ep["analysis"] = create_sample_analysis(ep)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(episodes, f, indent=2, ensure_ascii=False)

    use_cases = build_use_cases_index(episodes)
    with open(USE_CASES_PATH, "w", encoding="utf-8") as f:
        json.dump(use_cases, f, indent=2, ensure_ascii=False)

    print("Done! Saved %d episodes and %d use cases." % (len(episodes), len(use_cases)))
    print("NOTE: This is sample data. Run analyze.py with ANTHROPIC_API_KEY for real AI analysis.")


if __name__ == "__main__":
    main()
