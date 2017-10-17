const { Crawler } = require('./crawler.js')

const crawler = new Crawler('https://fr.orson.io')

const main = async () => {
  await crawler.crawl()
  console.log('Done')
}

main()