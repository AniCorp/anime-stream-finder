type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
    Pick<T, Exclude<keyof T, Keys>> &
    { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

interface AnimeBase {
    episodeNumber: number;
    malId?: number;
    anilistId?: number;
}

type AnimeTitles = {
    englishTitle?: string;
    title?: string;
    japaneseTitle?: string;
};

export type Anime = AnimeBase & RequireAtLeastOne<AnimeTitles, "englishTitle" | "title" | "japaneseTitle">;
