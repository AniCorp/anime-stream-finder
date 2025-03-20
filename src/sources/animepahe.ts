import { Anime, AnimeItem } from '#interfaces/anime';
import { StreamSource, StreamData } from '#interfaces/stream';
import { api_crawler } from '#utils/crawler';
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

async function filterByAverageScore(animeList: AnimeItem[]): Promise<AnimeItem[]> {
  const scores = animeList
    .map(anime => anime.similarity?.highestScore)
    .filter((score): score is number => typeof score === 'number');

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

  await api_crawler(urls, cookie, async ({ body, request }) => {
    try {
      const responseBody = body;
      if (responseBody) {
        const json = JSON.parse(responseBody.toString());
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

async function getEpisodeSession(anime: { episodeNumber: number }, detail: { session: string }): Promise<string | null> {
  let episodeSession: string | null = null;
  let page = 1;
  const baseUrl = `https://animepahe.ru/api?m=release&id=${detail.session}&sort=episode_asc&page=`;
  let targetEpisode: number | null = null;

  while (true) {
    const url = baseUrl + page;
    const cookie = generateCookie();
    let pageData: any;

    await api_crawler([url], cookie, async ({ body, request }) => {
      try {
        if (body) {
          pageData = JSON.parse(body.toString());
        }
      } catch (error) {
        console.error(`Error parsing JSON from ${request.url}:`, error);
      }
    });

    if (!pageData || !pageData.data || pageData.data.length === 0) {
      break;
    }

    if (targetEpisode === null && page === 1) {
      const firstEpisodeNumber = pageData.data[0].episode;
      targetEpisode = firstEpisodeNumber + (anime.episodeNumber - 1);
    }

    const episodeItem = pageData.data.find((ep: any) => ep.episode === targetEpisode);
    if (episodeItem) {
      episodeSession = episodeItem.session;
      break;
    }

    if (pageData.current_page >= pageData.last_page) {
      break;
    }

    page++;
  }

  return episodeSession;
}

async function fetchMatchingAnimeDetails(
  anime: Anime,
  animeList: AnimeItem[]
): Promise<any> {
  if (!anime.malId && !anime.anilistId)
    return {};

  const cookie = generateCookie();
  const urls: string[] = animeList.map(
    animeItem => `https://animepahe.ru/api?m=detail&id=${animeItem.session}`
  );

  const results: any[] = [];

  await api_crawler(urls, cookie, async ({ body, request }) => {
    try {
      if (body) {
        const detailData = JSON.parse(body.toString());
        results.push(detailData);
      }
    } catch (error) {
      console.error(`Error parsing JSON from ${request.url}:`, error);
    }
  });

  const matchingDetail = results.find(detailData => {
    const malMatch = anime.malId !== undefined ? detailData.mal === anime.malId : true;
    const anilistMatch = anime.anilistId !== undefined ? detailData.anilist === anime.anilistId : true;
    return malMatch && anilistMatch;
  });

  return matchingDetail || {};
}

export const animePahe: StreamSource = {
  async searchAnime(anime: Anime): Promise<StreamData | null> {
    const animeList = await search(anime);
    const details = await fetchMatchingAnimeDetails(anime, animeList);
    const episodeSession = await getEpisodeSession(anime, details);
    return episodeSession;
  },
};
