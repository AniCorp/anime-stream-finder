import { Anime } from "./anime";

export interface StreamData {
  author: string;
  url: string;
  size?: string | number;
  resolution: string;
  language: string;
}

export interface SourceStreamData {
  name: string;
  streams: StreamData[];
}

export interface AnimeDetails {
  id: number;
  mal?: number;
  anidb?: number;
  ann?: number;
  anime_planet?: string;
  anilist?: number;
  notify?: string;
  kitsu?: number;
  wikipedia?: string;
  title: string;
  title_en?: string;
  title_ja?: string;
  title_others?: string;
  title_pref?: string;
  synopsis?: string;
  poster?: string;
  type?: string;
  episodes?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  season?: string;
  year?: number;
  studios?: string;
  producers?: string;
  licensors?: string;
  duration?: number;
  original_audio?: string;
  audio?: string[];
  nsfw?: number;
  preview?: string;
  classification?: string;
  score?: number;
  rank?: number;
  popularity_rank?: number;
  members_count?: number;
  completed?: number;
  filename?: string;
  session?: string;
  created_at?: string;
  updated_at?: string;
  genres?: Array<{
    id: number;
    slug: string;
    name: string;
    description?: string;
    cover?: string;
    pivot?: object;
  }>;
}

export interface StreamSource {
  name: string;
  searchAnime(anime: Anime): Promise<{
    anime: AnimeDetails;
    streams: StreamData[];
  } | null>;
}
