import { Anime } from '#interfaces/anime.js';
import { findAnime } from './dispatcher.js';

async function findStream(anime: Anime): Promise<object> {
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

const anime: Anime = {
    title: 'Shangri-La Frontier',
    englishTitle: 'Shangri-La Frontier',
    japaneseTitle: 'シャングリラ',
    season: 'Fall',
    year: 2024,
    episodeNumber: 3,
    malId: undefined,
    anilistId: 176508
}

const response = await findStream(anime)

console.log(JSON.stringify(response.data, null, 4));

export {
    findStream
}