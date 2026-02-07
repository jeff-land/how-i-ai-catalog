#!/usr/bin/env python3
"""
collect.py — Fetch all video metadata and transcripts from the How I AI YouTube channel.

Usage:
    python scripts/collect.py

Output:
    data/episodes.json
"""

import json
import os
import sys
import time
from typing import Optional

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi

CHANNEL_URL = "https://www.youtube.com/@howiaipodcast/videos"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "episodes.json")
DELAY_SECONDS = 2


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
            }
        )

    print("Found %d videos (excluding shorts)." % len(videos))
    return videos


def fetch_transcript(ytt_api, video_id):
    # type: (YouTubeTranscriptApi, str) -> Optional[str]
    """Fetch English transcript for a single video. Returns joined text or None."""
    try:
        # New API: instance-based, fetch() returns FetchedTranscript
        fetched = ytt_api.fetch(video_id, languages=["en"])
        # FetchedTranscript is iterable, each snippet has .text
        full_text = " ".join(snippet.text for snippet in fetched)
        return full_text
    except Exception as e:
        # Try listing available transcripts and fetching whatever is available
        try:
            transcript_list = ytt_api.list(video_id)
            # Try to find any transcript and fetch it
            for transcript in transcript_list:
                try:
                    fetched = transcript.fetch()
                    full_text = " ".join(snippet.text for snippet in fetched)
                    return full_text
                except Exception:
                    continue
        except Exception:
            pass

        print("  Warning: No transcript for %s: %s" % (video_id, e))
        return None


def main():
    videos = fetch_video_list()

    # Create a single API instance (reuses session/cookies)
    ytt_api = YouTubeTranscriptApi()

    success_count = 0
    fail_count = 0

    for i, video in enumerate(videos):
        vid = video["id"]
        title_short = video["title"][:60] if video.get("title") else "Unknown"
        print("[%d/%d] Fetching transcript for: %s..." % (i + 1, len(videos), title_short))
        transcript = fetch_transcript(ytt_api, vid)
        video["transcript"] = transcript

        if transcript:
            success_count += 1
            word_count = len(transcript.split())
            print("  Got %d words" % word_count)
        else:
            fail_count += 1

        # Rate-limit
        if i < len(videos) - 1:
            time.sleep(DELAY_SECONDS)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(videos, f, indent=2, ensure_ascii=False)

    print("\nDone! %d transcripts fetched, %d failed." % (success_count, fail_count))
    print("Saved to %s" % os.path.abspath(OUTPUT_PATH))


if __name__ == "__main__":
    main()
