import { Anime } from '#interfaces/anime';
import { StreamSource, StreamData } from '#interfaces/stream';

export const animePahe: StreamSource = {
  async searchAnime(anime: Anime): Promise<StreamData | null> {
    return null
  },
};