import { Anime } from "./anime";

export interface StreamData {
    links: {
      [source: string]: {
        author: string;
        url: string;
        size?: string | number;
        resolution: string;
        language: string;
      }[];
    };
}
  
export interface StreamSource {
    searchAnime(anime: Anime): Promise<StreamData | null>;
}