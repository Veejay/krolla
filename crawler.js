const URL = require('url')
const puppeteer = require('puppeteer')
const chalk = require('chalk')
const fs = require('fs')
class Worker {
  // Kind of strange that the scouts themselves would grab the
  // jobs but it'll for now
  constructor(browser, crawler) {
    this.browser = browser
    this.crawler = crawler
  }

  async init(index) {
    this.name = `worker_${index}`
    console.log(`Initializing ${this.name}`)
    return new Promise(async (resolve, reject) => {
      this.page = await this.browser.newPage()
      resolve(this)
    })
  }

  async visit(url) {
    console.log(`${chalk.bgBlue.white.bold("Visiting")} ${url}`)
    return new Promise(async (resolve, reject) => {
      try {
        await this.page.goto(url, {timeout: 20000})
        const links = await this.page.evaluate(() => {
          return Array.from(document.querySelectorAll('a')).map(link => link.href)
        })
        this.crawler.visitedUrls.add(url)
        this.crawler.push(new Set(links))
        resolve(true)
      } catch(error) {
        this.crawler.errors.add(url)
        resolve(true)
      }
    })
  }
}

class Crawler {
  constructor({rootUrl, poolSize}) {
    this.poolSize = poolSize
    this.host = URL.parse(rootUrl).host
    this.pendingUrls = new Set([rootUrl])
    this.visitedUrls = new Set()
    this.count = {}
    this.errors = new Set()
  }

  async init() {
    return new Promise(async (resolve, reject) => {
      try {
        this.browser = await puppeteer.launch()
        const workers = []
        for (let i = 0; i < this.poolSize; i++) {
          const worker = new Worker(this.browser, this)
          workers.push(worker.init(i))
        }
        this.workers = await Promise.all(workers)
        resolve(this)
      } catch(e) {
        reject(e)
      }
    })
  }

  popLocations() {
    const targets = [...this.pendingUrls].slice(0, this.poolSize - 1)
    this.pendingUrls = new Set([...this.pendingUrls].slice(this.poolSize))
    return targets
  }

  async crawl() {
    return new Promise(async (resolve, reject) => {
      let locations = []
      while (locations = this.popLocations()) {
        if (locations.length === 0) {
          break
        }
        const promises = locations.map((location, index) => {
          return this.workers[index].visit(location)
        })
        await Promise.all(promises)
      }
      resolve(this.visitedUrls.size)
    })
    
  }

  incrementCount(url) {
    this.count[url] = (this.count[url] || 0) + 1
  }

  outbound(url) {
    return URL.parse(url).host !== this.host
  }

  crawlable(url) {
    return !this.visitedUrls.has(url) && !this.outbound(url)
  }
  /**
   * @description Adds potentiallly crawlable URLs to the queue
   * @param {Set} urls 
   * @example crawler.push(['https://www.google.com', 'https://fr.orson.io])
   * @returns {void}
   */
  push(urls) {
    for (let url of urls) {
      this.incrementCount(url)
    }
    for (let url of [...urls].filter(url => {return this.crawlable(url) })) {
      this.pendingUrls.add(url)
    }
  }
}

module.exports = { Crawler }