const { Crawler } = require('./crawler.js')

const crawler = new Crawler({rootUrl: 'http://fr.orson.io', poolSize: 16})

const main = async () => {
  try {
    await crawler.init()
    const crawledUrls = await crawler.crawl()
    console.log(`Crawled ${crawledUrls} URLs`)
    console.log(`
Number of links per URL:
========================    
    `)
    console.log(crawler.count)
    await crawler.browser.close()
  } catch(e) {
    console.error(e)
  }
  
}

main()