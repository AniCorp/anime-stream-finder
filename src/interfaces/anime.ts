type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>> &
    { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

interface AnimeBase {
    season?: string,
    year?: number,
    episodeNumber: number;
    malId?: number;
    anilistId?: number;
}

type AnimeTitles = {
    englishTitle?: string;
    title?: string;
    japaneseTitle?: string;
};

type AnimePaheItemBase = {
    id: number,
    title: string;
    type: string;
    episodes: number;
    status: string;
    season: string;
    year: number;
    score: number;
    poster: string;
    session: string;
    similarity?: {
        highestScore: number,
        detailedScores: {}
    };
}

export type AnimePaheItem = AnimePaheItemBase
export type Anime = AnimeBase & RequireAtLeastOne<AnimeTitles, "englishTitle" | "title" | "japaneseTitle">;

