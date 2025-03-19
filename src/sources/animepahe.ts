import { Anime } from '#interfaces/anime';
import { StreamSource, StreamData } from '#interfaces/stream';
import { crawler } from '#utils/crawler';
import { attachSimilarityScores } from '#utils/similarity';
import crypto from 'crypto';

export function generateCookie(): string {
  const randomString = crypto.randomBytes(8).toString('hex');
  return `__ddg2_=${randomString}`;
}

const search = async (anime: Anime): Promise<any[]> => {
  const urls: string[] = [];
  if (anime.title) {
    urls.push(`https://animepahe.ru/api?m=search&q=${encodeURIComponent(anime.title)}`);
  }
  if (anime.englishTitle) {
    urls.push(`https://animepahe.ru/api?m=search&q=${encodeURIComponent(anime.englishTitle)}`);
  }
  if (anime.japaneseTitle) {
    urls.push(`https://animepahe.ru/api?m=search&q=${encodeURIComponent(anime.japaneseTitle)}`);
  }

  const results: any[] = [];
  const cookie = generateCookie();

  await crawler(urls, cookie, async ({ page, request }) => {
    try {
      const responseBody = await page.evaluate(() => document.body.textContent);
      if (responseBody) {
        const json = JSON.parse(responseBody);
        results.push(json);
      }
    } catch (error) {
      console.error(`Error parsing JSON from ${request.url}:`, error);
    }
  });

  return results;
};

export function flattenAndDeduplicate(responses: any[]): any[] {
  const combinedData: any[] = [];

  for (const response of responses) {
    if (response && Array.isArray(response.data)) {
      combinedData.push(...response.data);
    } else if (Array.isArray(response)) {
      combinedData.push(...response);
    }
  }

  const uniqueAnimes = combinedData.filter((item, index, self) =>
    index === self.findIndex((a) => a.session === item.session)
  );

  return uniqueAnimes;
}

export const animePahe: StreamSource = {
  async searchAnime(anime: Anime): Promise<StreamData | null> {
    const responses = await search(anime);
    const uniqueData = flattenAndDeduplicate(responses);
    const dataWithSimilarityScore = await attachSimilarityScores(anime, uniqueData);
    return dataWithSimilarityScore;
  },
};