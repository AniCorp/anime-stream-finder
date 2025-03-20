import { Anime, AnimeItem } from '#interfaces/anime';
import { StreamSource, StreamData } from '#interfaces/stream';
import { crawler } from '#utils/crawler';
import { attachSimilarityScores } from '#utils/similarity';
import crypto from 'crypto';

function generateCookie(): string {
  const randomString = crypto.randomBytes(8).toString('hex');
  return `__ddg2_=${randomString}`;
}

async function flattenAndDeduplicate(responses: any[]): Promise<any[]> {
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

async function filterByAverageScore(animeList: AnimeItem[]) {
  const scores = animeList
    .map(anime => anime.similarity?.highestScore)
    .filter(score => typeof score === 'number');

  const averageScore = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;

  const filteredAnimeList = animeList.filter(anime => {
    const score = anime.similarity?.highestScore;
    return typeof score === 'number' && score >= averageScore;
  });

  return filteredAnimeList;
}

async function search(anime: Anime): Promise<any[]> {
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

  const uniqueData = await flattenAndDeduplicate(results);
  const dataWithSimilarityScore = await attachSimilarityScores(anime, uniqueData);
  const dataFilteredByAverageScore = await filterByAverageScore(dataWithSimilarityScore);

  return dataFilteredByAverageScore;
}

async function getCorrectAnimeDetails(
  anime: Anime,
  animeList: AnimeItem[]
): Promise<any> {
  if (!anime.malId && !anime.anilistId)
    throw new Error("No malId or anilistId provided");

  const cookie = generateCookie();
  for (const animeItem of animeList) {
    const sessionId = animeItem.session;
    const url = `https://animepahe.ru/api?m=detail&id=${sessionId}`;
    let detailData: any = null;

    await crawler([url], cookie, async ({ page, request }) => {
      try {
        const responseBody = await page.evaluate(() => document.body.textContent);
        if (responseBody) {
          detailData = JSON.parse(responseBody);
        }
      } catch (error) {
        console.error(`Error parsing JSON from ${request.url}:`, error);
      }
    });

    if (detailData) {
      const malMatch =
        anime.malId !== undefined ? detailData.mal === anime.malId : true;
      const anilistMatch =
        anime.anilistId !== undefined ? detailData.anilist === anime.anilistId : true;

      if (malMatch && anilistMatch) {
        return detailData;
      }
    }
  }

  throw new Error("Anime not found");
}

export const animePahe: StreamSource = {
  async searchAnime(anime: Anime): Promise<StreamData | null> {
    const animeList = await search(anime);
    const details = await getCorrectAnimeDetails(anime, animeList);

    return details;
  },
};
