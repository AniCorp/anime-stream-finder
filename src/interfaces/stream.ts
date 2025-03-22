import { Anime } from "./anime";

export interface StreamData {
    links: {
        [source: string]: {
            [language: string]: {
                [resolution: string]: {
                    author: string,
                    url: string,
                    size?: string | number,
                }
            }
        }
    };
}
  
export interface StreamSource {
    searchAnime(anime: Anime): Promise<StreamData | null>;
}