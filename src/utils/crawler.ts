import { RequestQueue, PlaywrightCrawler, type PlaywrightCrawlingContext } from 'crawlee';
import { BrowserName, DeviceCategory, OperatingSystemsName } from '@crawlee/browser-pool';

export async function crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: PlaywrightCrawlingContext) => Promise<void>
): Promise<void> {
  const requestQueue = await RequestQueue.open();

  // Ensure urls is an array
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
      useFingerprints: true,
      fingerprintOptions: {
        fingerprintGeneratorOptions: {
          browsers: [
            {
              name: BrowserName.chrome,
              minVersion: 96,
            },
          ],
          devices: [DeviceCategory.desktop],
          operatingSystems: [OperatingSystemsName.windows],
        },
      },
    },
    async requestHandler(context) {
      await customRequestHandler(context);
    },
  });

  await crawler.run();
}
