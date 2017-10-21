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
    this._done = false
  }

  get done() {
    return this._done
  }

  set done(done) {
    this._done = done
  }

  async init(index) {
    this.name = `worker_${index}`
    console.log(`${chalk.yellow('Initializing')} ${this.name}`)
    return new Promise(async (resolve, reject) => {
      this.page = await this.browser.newPage()
      resolve(this)
    })
  }

  async sleep(timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, timeout)
    })
  }

  async run() {
    return new Promise(async (resolve, reject) => {
      let location = ''
      while (!this.crawler.done) {
        try {
          location = this.crawler.nextLocation
          if (typeof location === 'undefined') {
            this.done = true
            await this.sleep(2000)
          } else {
            this.done = false
            console.log(`${chalk.bgBlue.white.bold(this.name)}\tvisiting ${chalk.green(location)}`)
            await this.page.goto(location, {timeout: 20000})
            const links = await this.page.evaluate(() => {
              return Array.from(document.querySelectorAll('a')).map(link => link.href)
            })
            this.crawler.visitedUrls.add(location)
            this.crawler.push(new Set(links))
          }
        } catch(error) {
          this.crawler.errors.add(location)
        }
      }
      resolve(true)
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
  get pending() {
    return [...this.pendingUrls]
  }

  get nextLocation () {
    const [location, ...urls] = [...this.pendingUrls]
    this.pendingUrls = new Set(urls)
    return location
  }
  get done() {
    return this.workers.every(worker => {return worker.done}) && Object.is(this.pending.length, 0)
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
  async writeReport() {
    return new Promise((resolve, reject) => {
      fs.writeFile('report.txt', [...this.errors].join("\n"), 'utf-8', error => {
        if (error) {
          console.error("Couldn't write to report.txt")
          reject(error)
        } else {
          resolve(true)
        }
      })
    })
  }
  async crawl() {
    return new Promise(async (resolve, reject) => {
      try {
        let locations = []
        const promises = this.workers.map(worker => {
          return worker.run()
        })
        await Promise.all(promises)
        await this.writeReport()
        resolve(true)
      } catch(error) {
        reject(error)
      }
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