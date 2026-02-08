#!/usr/bin/env python3
"""
collect.py — Fetch all video metadata and transcripts from the How I AI YouTube channel.

Usage:
    python scripts/collect.py
    python scripts/collect.py --force   # Re-fetch all transcripts even if already present

Output:
    data/episodes.json
"""

import json
import os
import sys
import time
from typing import Optional, Tuple, List, Dict

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

CHANNEL_URL = "https://www.youtube.com/@howiaipodcast/videos"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "episodes.json")
DELAY_SECONDS = 5  # Longer delay to avoid YouTube rate limiting


def fetch_video_list():
    """Use yt-dlp to get metadata for every video on the channel."""
    print("Fetching video list from %s ..." % CHANNEL_URL)
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        "skip_download": True,
        "ignoreerrors": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(CHANNEL_URL, download=False)

    if not info:
        print("ERROR: Could not fetch channel info.")
        sys.exit(1)

    entries = info.get("entries", [])
    videos = []

    for entry in entries:
        if entry is None:
            continue
        # Skip YouTube Shorts (typically < 60s)
        duration = entry.get("duration") or 0
        if duration < 60:
            continue

        videos.append(
            {
                "id": entry.get("id"),
                "title": entry.get("title"),
                "description": entry.get("description", ""),
                "publish_date": entry.get("upload_date"),  # YYYYMMDD
                "duration_seconds": duration,
                "thumbnail_url": entry.get("thumbnail"),
                "url": "https://www.youtube.com/watch?v=%s" % entry.get("id"),
                "transcript": None,
                "transcript_segments": None,
            }
        )

    print("Found %d videos (excluding shorts)." % len(videos))
    return videos


def fetch_transcript(ytt_api, video_id):
    # type: (YouTubeTranscriptApi, str) -> Tuple[Optional[str], Optional[List[Dict]]]
    """Fetch English transcript for a single video.
    Returns (plain_text, segments) where segments is a list of {text, start} dicts."""
    try:
        fetched = ytt_api.fetch(video_id, languages=["en"])
        segments = []
        texts = []
        for snippet in fetched:
            texts.append(snippet.text)
            segments.append({
                "text": snippet.text,
                "start": round(snippet.start, 1),
            })
        full_text = " ".join(texts)
        return full_text, segments
    except Exception as e:
        # Try listing available transcripts and fetching whatever is available
        try:
            transcript_list = ytt_api.list(video_id)
            for transcript in transcript_list:
                try:
                    fetched = transcript.fetch()
                    segments = []
                    texts = []
                    for snippet in fetched:
                        texts.append(snippet.text)
                        segments.append({
                            "text": snippet.text,
                            "start": round(snippet.start, 1),
                        })
                    full_text = " ".join(texts)
                    return full_text, segments
                except Exception:
                    continue
        except Exception:
            pass

        print("  Warning: No transcript for %s: %s" % (video_id, e))
        return None, None


def main():
    force = "--force" in sys.argv
    videos = fetch_video_list()

    # Load existing data to preserve already-fetched transcripts
    existing_data = {}
    if not force and os.path.exists(OUTPUT_PATH):
        with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
            existing = json.load(f)
            for ep in existing:
                existing_data[ep["id"]] = ep
        print("Loaded %d existing episodes from cache." % len(existing_data))

    ytt_api = YouTubeTranscriptApi()

    success_count = 0
    skip_count = 0
    fail_count = 0

    for i, video in enumerate(videos):
        vid = video["id"]
        title_short = video["title"][:60] if video.get("title") else "Unknown"

        # Check if we already have a transcript with segments
        existing = existing_data.get(vid)
        if existing and existing.get("transcript") and existing.get("transcript_segments"):
            video["transcript"] = existing["transcript"]
            video["transcript_segments"] = existing["transcript_segments"]
            skip_count += 1
            print("[%d/%d] Skipping (cached): %s" % (i + 1, len(videos), title_short))
            continue
        elif existing and existing.get("transcript") and not existing.get("transcript_segments"):
            # Has plain text but no segments — need to re-fetch for segments
            print("[%d/%d] Re-fetching for timestamps: %s..." % (i + 1, len(videos), title_short))
        else:
            print("[%d/%d] Fetching transcript for: %s..." % (i + 1, len(videos), title_short))

        transcript, segments = fetch_transcript(ytt_api, vid)
        video["transcript"] = transcript
        video["transcript_segments"] = segments

        if transcript:
            success_count += 1
            word_count = len(transcript.split())
            seg_count = len(segments) if segments else 0
            print("  Got %d words, %d segments" % (word_count, seg_count))
        else:
            # Preserve existing plain-text transcript if re-fetch fails
            if existing and existing.get("transcript"):
                video["transcript"] = existing["transcript"]
                print("  Re-fetch failed, keeping existing plain text")
            fail_count += 1

        # Save after each fetch (allows resuming)
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
        with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
            json.dump(videos, f, indent=2, ensure_ascii=False)

        # Rate-limit
        if i < len(videos) - 1:
            time.sleep(DELAY_SECONDS)

    # Final save
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(videos, f, indent=2, ensure_ascii=False)

    print("\nDone! %d fetched, %d skipped (cached), %d failed." % (success_count, skip_count, fail_count))
    with_transcript = sum(1 for v in videos if v.get("transcript"))
    with_segments = sum(1 for v in videos if v.get("transcript_segments"))
    print("Total: %d with transcript, %d with timestamp segments" % (with_transcript, with_segments))
    print("Saved to %s" % os.path.abspath(OUTPUT_PATH))


if __name__ == "__main__":
    main()
