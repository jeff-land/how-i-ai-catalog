#!/usr/bin/env python3
"""
collect_remaining.py — Use yt-dlp to download subtitles for episodes
that are missing transcripts in episodes.json.

This is a fallback for when youtube-transcript-api gets IP-blocked.
yt-dlp uses a different approach that often avoids the block.

Usage:
    python scripts/collect_remaining.py
"""

import json
import os
import re
import sys
import time
import glob
import tempfile

import yt_dlp

EPISODES_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "episodes.json")
DELAY_SECONDS = 3


def clean_subtitle_text(vtt_content):
    """Extract plain text from VTT/SRT subtitle content."""
    lines = vtt_content.split("\n")
    text_lines = []
    seen = set()

    for line in lines:
        line = line.strip()
        # Skip empty lines, timestamps, VTT headers, and sequence numbers
        if not line:
            continue
        if line.startswith("WEBVTT"):
            continue
        if line.startswith("Kind:") or line.startswith("Language:"):
            continue
        if re.match(r"^\d+$", line):
            continue
        if re.match(r"^\d{2}:\d{2}", line):
            continue
        if "-->" in line:
            continue

        # Remove HTML tags
        clean = re.sub(r"<[^>]+>", "", line)
        clean = clean.strip()

        if clean and clean not in seen:
            seen.add(clean)
            text_lines.append(clean)

    return " ".join(text_lines)


def download_subtitles_for_video(video_id):
    """Use yt-dlp to download auto-generated subtitles for a video."""
    url = "https://www.youtube.com/watch?v=%s" % video_id

    with tempfile.TemporaryDirectory() as tmpdir:
        output_template = os.path.join(tmpdir, "%(id)s")

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "writeautomaticsub": True,
            "writesubtitles": True,
            "subtitleslangs": ["en"],
            "subtitlesformat": "vtt",
            "outtmpl": output_template,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
        except Exception as e:
            print("  yt-dlp error: %s" % e)
            return None

        # Look for the subtitle file
        vtt_files = glob.glob(os.path.join(tmpdir, "*.vtt"))
        if not vtt_files:
            print("  No subtitle file generated")
            return None

        # Read and parse the VTT file
        with open(vtt_files[0], "r", encoding="utf-8") as f:
            content = f.read()

        text = clean_subtitle_text(content)
        return text if text else None


def main():
    if not os.path.exists(EPISODES_PATH):
        print("ERROR: %s not found. Run collect.py first." % EPISODES_PATH)
        sys.exit(1)

    with open(EPISODES_PATH, "r", encoding="utf-8") as f:
        episodes = json.load(f)

    # Find episodes missing transcripts
    missing = [ep for ep in episodes if not ep.get("transcript")]
    print("Found %d episodes missing transcripts out of %d total." % (len(missing), len(episodes)))

    if not missing:
        print("All episodes already have transcripts!")
        return

    success = 0
    fail = 0

    for i, ep in enumerate(missing):
        vid = ep["id"]
        title_short = (ep.get("title") or "Unknown")[:60]
        print("[%d/%d] Downloading subtitles for: %s..." % (i + 1, len(missing), title_short))

        text = download_subtitles_for_video(vid)
        if text:
            ep["transcript"] = text
            success += 1
            print("  Got %d words" % len(text.split()))
        else:
            fail += 1

        # Save progress after each video
        with open(EPISODES_PATH, "w", encoding="utf-8") as f:
            json.dump(episodes, f, indent=2, ensure_ascii=False)

        if i < len(missing) - 1:
            time.sleep(DELAY_SECONDS)

    print("\nDone! %d additional transcripts fetched, %d still missing." % (success, fail))
    total_with = sum(1 for ep in episodes if ep.get("transcript"))
    print("Total episodes with transcripts: %d / %d" % (total_with, len(episodes)))


if __name__ == "__main__":
    main()
