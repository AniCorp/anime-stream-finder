import { Anime } from '#interfaces/anime';
import { StreamSource, StreamData } from '#interfaces/stream';
import { animePahe } from '#sources/animepahe';

const sources: StreamSource[] = [animePahe];

export async function findAnime(anime: Anime): Promise<StreamData[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        return await source.searchAnime(anime);
      } catch (error) {
        console.error(`Error from a source: ${error}`);
        return null;
      }
    })
  );

  return results.filter((result): result is StreamData => result !== null);
}