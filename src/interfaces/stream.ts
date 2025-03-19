import { Anime } from "./anime";

export interface StreamData {
    links: {
        [language: string]: {
            [resolution: string]: string;
        };
    };
    match: number
}
  
export interface StreamSource {
    searchAnime(anime: Anime): Promise<StreamData | null>;
}