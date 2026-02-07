export interface UseCase {
  title: string;
  one_liner: string | null;
  description: string;
  tools: string[];
  category: string;
  audience: string;
  difficulty: string;
  intents?: string[];
  is_pick?: boolean;
  pick_reason?: string | null;
}

export interface EpisodeAnalysis {
  guest_name: string | null;
  guest_role: string | null;
  summary: string | null;
  key_takeaways: string[];
  use_cases: UseCase[];
  tools_mentioned: string[];
  notable_quotes: string[];
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  publish_date: string; // YYYYMMDD
  duration_seconds: number;
  thumbnail_url: string;
  url: string;
  transcript: string | null;
  analysis: EpisodeAnalysis | null;
}

export interface UseCaseFlat {
  title: string;
  one_liner: string | null;
  description: string;
  tools: string[];
  category: string;
  audience: string;
  difficulty: string;
  intents: string[];
  is_pick: boolean;
  pick_reason: string | null;
  episode_id: string;
  episode_title: string;
  guest_name: string | null;
  guest_role: string | null;
  publish_date: string;
}
