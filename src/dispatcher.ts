import { Anime } from '#interfaces/anime';
import { SourceStreamData, StreamSource, StreamData } from '#interfaces/stream';
import { animePahe } from '#sources/animepahe';

const sources: StreamSource[] = [animePahe];

export async function findAnime(anime: Anime): Promise<SourceStreamData[]> {
  const results = await Promise.all(
    sources.map(async (source) => {
      try {
        const result = await source.searchAnime(anime);
        return { 
          name: source.name, 
          streams: result?.streams ?? [] 
        };
      } catch (error) {
        console.error(`Error from ${source.name}: ${error}`);
        return null;
      }
    })
  );

  return results.filter((result): result is SourceStreamData => result !== null);
}
