import { Anime } from "./anime";

export interface StreamData {
    links: {
        [language: string]: {
            [resolution: string]: {
                source: string,
                url: string,
                size?: string | number,
            };
        };
    };
}
  
export interface StreamSource {
    searchAnime(anime: Anime): Promise<StreamData | null>;
}