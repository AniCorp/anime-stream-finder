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

export interface StreamSource {
  name: string;
  searchAnime(anime: Anime): Promise<StreamData[] | null>;
}
