import {
  RequestQueue,
  PlaywrightCrawler,
  type PlaywrightCrawlingContext,
  CheerioCrawler,
  CheerioCrawlingContext,
  Configuration,
  BrowserPool,
} from 'crawlee';

// Track active browser instances with Playwright-specific type parameters
const activeBrowsers: Set<BrowserPool<{ 
  browserPlugins: [import('@crawlee/browser-pool').PlaywrightPlugin]
}>> = new Set();

function cleanupBrowsers() {
  for (const browserPool of activeBrowsers) {
    try {
      browserPool.destroy();
    } catch (err) {
      console.error('Error cleaning up browser:', err);
    }
  }
  activeBrowsers.clear();
}

// Register cleanup handlers
process.on('exit', cleanupBrowsers);
process.on('SIGINT', () => {
  cleanupBrowsers();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupBrowsers();
  process.exit(0);
});
import { BrowserName, DeviceCategory, OperatingSystemsName } from '@crawlee/browser-pool';
import { v4 as uuidv4 } from 'uuid';

const config = new Configuration({
  persistStorage: false,
  logLevel: 1
});

export async function browser_crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: PlaywrightCrawlingContext) => Promise<void>,
  maxRequestRetries: number = 5
): Promise<void> {
  const taskId = uuidv4();
  const requestQueue = await RequestQueue.open(taskId);

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
  }, config);

  activeBrowsers.add(crawler.browserPool);
  await crawler.run();
  await requestQueue.drop();
  activeBrowsers.delete(crawler.browserPool);
}

export async function crawler(
  urls: string | string[],
  cookie: string,
  customRequestHandler: (context: CheerioCrawlingContext) => Promise<void>,
  maxRequestRetries: number = 3
): Promise<void> {
  const taskId = uuidv4();
  const requestQueue = await RequestQueue.open(taskId);

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
  }, config);

  await crawler.run();
  await requestQueue.drop()
}
