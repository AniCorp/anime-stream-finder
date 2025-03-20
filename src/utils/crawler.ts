import { RequestQueue, PlaywrightCrawler, type PlaywrightCrawlingContext, CheerioCrawler, CheerioCrawlingContext } from 'crawlee';
import { BrowserName, DeviceCategory, OperatingSystemsName } from '@crawlee/browser-pool';

export async function browser_crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: PlaywrightCrawlingContext) => Promise<void>
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
    browserPoolOptions: {
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          browsers: [
            {
              name: BrowserName.chrome
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
  });

  await crawler.run();
}

export async function api_crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: CheerioCrawlingContext) => Promise<void>
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
    async requestHandler(context) {
      await customRequestHandler(context);
    },
  });

  await crawler.run();
}
