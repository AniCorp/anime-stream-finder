import { Anime, AnimeItem } from '#interfaces/anime';
import { StreamSource, StreamData, AnimeDetails } from '#interfaces/stream';
import { crawler, browser_crawler } from '#utils/crawler';
import { attachSimilarityScores } from '#utils/similarity';
import crypto from 'crypto';

interface DownloadLinkDetail {
  pahewin: string;
  author: string;
  resolution: string;
  size: string;
  language: string;
  kwik: string;
  url?: string | null;
}

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

  await crawler(urls, cookie, async ({ body, request }) => {
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

async function getEpisodeSession(anime: { episodeNumber: number }, detail: { session: string }): Promise<any> {
  let page = 1;
  const baseUrl = `https://animepahe.ru/api?m=release&id=${detail.session}&sort=episode_asc&page=`;
  let targetEpisode: number | null = null;

  while (true) {
    const url = baseUrl + page;
    const cookie = generateCookie();
    let pageData: any;

    await crawler([url], cookie, async ({ body, request }) => {
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
      return episodeItem;
    }

    if (pageData.current_page >= pageData.last_page) {
      break;
    }

    page++;
  }

  return {};
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

  await crawler(urls, cookie, async ({ body, request }) => {
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

async function extractDownloadLinkDetails(
  animeSession: string,
  episodeSession: string
): Promise<DownloadLinkDetail[]> {
  const playUrl = `https://animepahe.ru/play/${animeSession}/${episodeSession}`;
  const cookie = generateCookie();
  let downloadLinks: DownloadLinkDetail[] = [];

  await browser_crawler(playUrl, cookie, async (context) => {
    const { page } = context;
    await page.waitForSelector('#pickDownload');
    downloadLinks = await page.evaluate(() => {
      const results: DownloadLinkDetail[] = [];
      const container = document.getElementById('pickDownload');
      if (container) {
        const links = container.querySelectorAll('a.dropdown-item');
        links.forEach((link) => {
          const href = link.getAttribute('href') || '';
          let author = '';
          let resolution = '';
          let size = '';
          let language = 'jpn';
          const languageSpan = link.querySelector('span.badge-warning');
          if (languageSpan && languageSpan.textContent) {
            language = languageSpan.textContent.trim();
          }
    
          const linkClone = link.cloneNode(true) as HTMLElement;
          const spanElements = linkClone.querySelectorAll('span');
          spanElements.forEach(span => span.remove());
          const cleanText = linkClone.textContent?.trim() || '';
    
          const match = cleanText.match(/^(.+?)\s·\s(\d+p)\s\((.+?)\)$/);
          if (match) {
            author = match[1].trim();
            resolution = match[2].trim();
            size = match[3].trim();
          }
    
          results.push({
            pahewin: href,
            author,
            resolution,
            size,
            language,
            kwik: ''
          });
        });
      }
      return results;
    });
  });

  return downloadLinks;
}

async function resolveCountdownSkipLinks(
  playDetails: DownloadLinkDetail[]
): Promise<DownloadLinkDetail[]> {
  const urls = playDetails.map(detail => detail.pahewin);
  const cookie = generateCookie();

  await crawler(urls, cookie, async ({ body, request }) => {
    try {
      const pageContent = body.toString();
      const regex = /attr\("href",\s*"([^"]+)"\)/g;
      let match: RegExpExecArray | null;
      let tokenUrl = '';
      while ((match = regex.exec(pageContent)) !== null) {
        if (match[1].startsWith('http')) {
          tokenUrl = match[1];
          break;
        }
      }

      const detail = playDetails.find(item => item.pahewin === request.url);
      if (detail && tokenUrl) {
        detail.kwik = tokenUrl;
      }
    } catch (error) {
      console.error(`Error processing skip link from ${request.url}:`, error);
    }
  });

  return playDetails;
}

async function getMp4Url(pahewinDetails: DownloadLinkDetail[]): Promise<DownloadLinkDetail[]> {
  const urls = pahewinDetails.map(detail => detail.kwik);
  const cookie = generateCookie();

  await browser_crawler(urls, cookie, async (context) => {
    const { page, request } = context;
    await page.waitForSelector('form', { timeout: 10000 });

    const formAction: string = await page.$eval('form', (form) => (form as HTMLFormElement).action);
    const token: string = await page.$eval('input[name="_token"]', (input) => (input as HTMLInputElement).value);

    const cookies = await page.context().cookies();
    const cookiesStr = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');

    const response = await page.request.fetch(formAction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookiesStr,
        'Referer': formAction
      },
      data: `_token=${encodeURIComponent(token)}`,
      maxRedirects: 0,
    });

    const mp4Url = response.headers()['location'] || null;
    const detail = pahewinDetails.find(item => item.kwik === request.url);

    if (detail && mp4Url) {
      detail.kwik = mp4Url;
    } else {
      throw new Error(`MP4 URL extraction failed for ${request.url}`);
    }
  });

  return pahewinDetails;
}

export function formatStreamData(downloadLinks: DownloadLinkDetail[]): StreamData[] {
  return downloadLinks.map(link => ({
    author: link.author,
    url: link.kwik,
    size: link.size,
    resolution: link.resolution,
    language: link.language,
  }));
}

export const animePahe: StreamSource = {
  name: "animepahe",
  async searchAnime(anime: Anime): Promise<{
    anime: AnimeDetails;
    streams: StreamData[];
  } | null> {
    const animeList = await search(anime);
    const animeDetails = await fetchMatchingAnimeDetails(anime, animeList);
    if (!animeDetails.session) return null;

    const episodeDetails = await getEpisodeSession(anime, animeDetails);
    if (!episodeDetails.session) return null;

    const animeSession = animeDetails.session;
    const episodeSession = episodeDetails.session;

    const playDetails = await extractDownloadLinkDetails(animeSession, episodeSession);
    const pahewinDetails = await resolveCountdownSkipLinks(playDetails);
    const kwikDetails = await getMp4Url(pahewinDetails);

    const streams = formatStreamData(kwikDetails);

    return {
      anime: animeDetails,
      streams
    };
  },
};
