import {
  RequestQueue,
  PlaywrightCrawler,
  type PlaywrightCrawlingContext,
  CheerioCrawler,
  CheerioCrawlingContext,
} from 'crawlee';
import { BrowserName, DeviceCategory, OperatingSystemsName } from '@crawlee/browser-pool';

export async function browser_crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: PlaywrightCrawlingContext) => Promise<void>,
  maxRequestRetries: number = 3
): Promise<void> {
  const requestQueue = await RequestQueue.open();

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
          browsers: [
            {
              name: BrowserName.chrome,
            },
          ],
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
}

export async function crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: CheerioCrawlingContext) => Promise<void>,
  maxRequestRetries: number = 3
): Promise<void> {
  const requestQueue = await RequestQueue.open();

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
}
