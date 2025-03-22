import { findAnime } from '#root/dispatcher';
import { Anime } from '#interfaces/anime';

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
        return {
            data: results,
            status: 200, 
            headers: { 'Content-Type': 'application/json' }
        }
    } catch (error) {
        console.error('Internal error:', error);
        return {
            error: 'Internal Server Error',
            status: 500, 
            headers: { 'Content-Type': 'application/json' }
        }
    }
}