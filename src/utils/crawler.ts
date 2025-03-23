import {
  RequestQueue,
  PlaywrightCrawler,
  type PlaywrightCrawlingContext,
  CheerioCrawler,
  CheerioCrawlingContext,
  KeyValueStore
} from 'crawlee';
import { BrowserName, DeviceCategory, OperatingSystemsName } from '@crawlee/browser-pool';
import { v4 as uuidv4 } from 'uuid';

export async function browser_crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: PlaywrightCrawlingContext) => Promise<void>,
  maxRequestRetries: number = 3
): Promise<void> {
  const taskId = uuidv4();
  const requestQueue = await RequestQueue.open(taskId);
  const kvStore = await KeyValueStore.open('default');

  const urlList = typeof urls === 'string' ? [urls] : urls;
  for (const url of urlList) {
    await requestQueue.addRequest({
      url,
      headers: { Cookie: cookie },
    });
  }

  const crawler = new PlaywrightCrawler({
    requestQueue,
    maxRequestRetries,
    browserPoolOptions: {
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          browsers: [{ name: BrowserName.chrome }],
          devices: [DeviceCategory.mobile],
          operatingSystems: [OperatingSystemsName.android],
        },
      },
    },
    async requestHandler(context) {
      await customRequestHandler(context);
    },
    async failedRequestHandler({ request, error }) {
      console.error(`Request ${request.url} failed after ${maxRequestRetries} retries. Error:`, error);
    },
  });

  await crawler.run();
  await kvStore.drop();
  await requestQueue.drop();
}

export async function crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: CheerioCrawlingContext) => Promise<void>,
  maxRequestRetries: number = 3
): Promise<void> {
  const taskId = uuidv4();
  const requestQueue = await RequestQueue.open(taskId);
  const kvStore = await KeyValueStore.open('default');

  const urlList = typeof urls === 'string' ? [urls] : urls;
  for (const url of urlList) {
    await requestQueue.addRequest({
      url,
      headers: { Cookie: cookie },
    });
  }

  const crawler = new CheerioCrawler({
    requestQueue,
    maxRequestRetries,
    async requestHandler(context) {
      await customRequestHandler(context);
    },
    async failedRequestHandler({ request, error }) {
      console.error(`Request ${request.url} failed after ${maxRequestRetries} retries. Error:`, error);
    },
  });

  await crawler.run();
  await kvStore.drop();
  await requestQueue.drop();
}
