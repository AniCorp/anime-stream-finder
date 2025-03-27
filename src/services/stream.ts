import { findAnime } from '#root/dispatcher';
import { Anime } from '#interfaces/anime';
import { ErrorHandler } from 'crawlee';
import { animePahe } from '#sources/animepahe';

export async function findStream(anime: Anime): Promise<any> {
    if (!anime.englishTitle && !anime.title && !anime.japaneseTitle) {
        return {
            error: 'At least one anime title must be provided',
            status: 400, 
            headers: { 'Content-Type': 'application/json' }
        }
    }
  
    if (!anime.episodeNumber) {
        return {
            error: 'episodeNumber must be provided',
            status: 400, 
            headers: { 'Content-Type': 'application/json' }
        }
    }
  
    if (typeof anime.episodeNumber !== 'number') {
        return {
            error: 'animeMalId, animeAnilistId and episodeNumber must be numbers',
            status: 400, 
            headers: { 'Content-Type': 'application/json' }
        }
    }

    try {
        const results = await findAnime(anime);
        // Get full anime details directly from the source
        const animeResult = await animePahe.searchAnime(anime);
        return {
            data: {
                anime: animeResult?.anime || null,
                sources: results
            },
            status: 200, 
            headers: { 'Content-Type': 'application/json' }
        }
    } catch (error: any) {
        throw new Error(error)
    }
}
