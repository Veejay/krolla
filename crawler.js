const URL = require('url')
const puppeteer = require('puppeteer')
const chalk = require('chalk')

class Crawler {
  constructor(url) {
    this.poolSize = 8
    this.host = URL.parse(url).host
    this.pendingUrls = new Set([url])
    this.visitedUrls = new Map()
    this.scouts = []
  }
  get report() {
    const report = new Report(this.visitedLinks)
    return report
  }

  popLocations() {
    const targets = [...this.pendingUrls].slice(0, this.poolSize - 1)
    this.pendingUrls = new Set([...this.pendingUrls].slice(this.poolSize))
    return targets
  }

  async crawl() {
    this.browser = await puppeteer.launch()
    let targets = []
    while (targets = this.popLocations()) {
      console.log
      const promises = targets.map(urls => {
        const result = this.visitPage(urls)
        console.log(result)
        return result
      })
      await Promise.all(promises)
    }
  }

  incrementVisits(url) {
    if (this.visitedUrls.has(url)) {
      const visits = this.visitedUrls.get(url)
      this.visitedUrls.set(url, visits + 1)
    } else {
      this.visitedUrls.set(url, 1)
    }
  }

  async visitPage(url) {
    console.log(`Visiting ${url}`)
    return new Promise(async (resolve, reject) => {
      try {
        const page = await this.browser.newPage()
        await page.goto(url)
        const links = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('a')).map(link => link.href)
        })
        this.incrementVisits(url)
        // FIXME: Makes no sense to push things to a crawler. The crawler should have a reference
        // to a higher-order object controlling storage of and access to crawlable URLs
        this.push(new Set(links))
        resolve(true)
      } catch(error) {
        reject(error)
      }
    })
    

  }

  outbound(url) {
    return URL.parse(url).host !== this.host
  }

  crawlable(url) {
    return !(this.visitedUrls.has(url)) && !this.outbound(url)
  }
  /**
   * @description Adds potentiallly crawlable URLs to the queue
   * @param {Set} urls 
   * @example crawler.push(['https://www.google.com', 'https://fr.orson.io])
   * @returns {void}
   */
  push(urls) {
    for (let url of [...urls].filter(this.crawlable.bind(this))) {
      this.pendingUrls.add(url)
    }
  }
}

module.exports = { Crawler }