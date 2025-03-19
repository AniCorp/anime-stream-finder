import { Anime } from "./anime";

export interface StreamData {
    links: {
        [language: string]: {
            [resolution: string]: string;
        };
    };
}
  
export interface StreamSource {
    searchAnime(anime: Anime): Promise<StreamData | null>;
}