const { Crawler } = require('./crawler.js')

/**
 * @see crawler.js
 */
const crawler = new Crawler({rootUrl: 'https://fr.orson.io', poolSize: 32})

const main = async () => {
  try {
    await crawler.init()
    const crawledUrls = await crawler.crawl()
    console.log('Done crawling. Find run information in report.txt')
    // Clean up
    await crawler.browser.close()
  } catch(e) {
    console.error(e)
  }
}

main()