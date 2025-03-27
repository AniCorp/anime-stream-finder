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
  anime: object,
  streams: StreamData[];
}

// AnimePahe specific details
export interface AnimePaheDetails {
  id: number;
  session: string;
  mal?: number;
  anidb?: number;
  ann?: number;
  anime_planet?: string;
  anilist?: number;
  title: string;
  title_en?: string;
  title_ja?: string;
  synopsis?: string;
  poster?: string;
  type?: string;
  episodes?: number;
  status?: string;
  score?: number;
  year?: number;
  season?: string;
  genres?: Array<{
    id: number;
    slug: string;
    name: string;
  }>;
}

export interface StreamSource<T = any> {
  name: string;
  searchAnime(anime: Anime): Promise<{
    anime: T;
    streams: StreamData[];
  } | null>;
}
