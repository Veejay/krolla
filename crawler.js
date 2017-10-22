// Used to check whether or not links point to external URLs
const URL = require('url')
// Used for the actual crawling with full browser capabilities
const puppeteer = require('puppeteer')
// Color debugging in the terminal
const chalk = require('chalk')
// Gratuitous use of streams to write report
const fs = require('fs')
const Stream = require('stream')

// The Worker class represents the workers doing the actual crawling, 
// which report crawled URLs to the Crawler
const { Worker } = require('./worker.js')

class Crawler {
  /**
   * @description Creates a new Crawler instance
   * @param {String} rootUrl - The URL we start crawling from
   * @param {Integer} poolSize - The number of concurrent Promise-based workers we'll use to crawl pages 
   */
  constructor({ rootUrl, poolSize }) {
    this.poolSize = poolSize
    this.host = URL.parse(rootUrl).host
    this.pendingUrls = new Set([rootUrl])
    this.locked = new Set()
    this.visitedUrls = new Set()
    this.count = {}
    this.errors = new Set()
  }

  /**
   * @returns {Array} A collection of crawlable URLs
   */
  get pending() {
    return [...this.pendingUrls]
  }

  /**
   * @description Indicates whether or not we're done crawling the website
   */
  get done() {
    return this.workers.every(worker => { return worker.done }) && Object.is(this.pending.length, 0)
  }

  /**
   * @description Initializer for the crawler since constructors cannot be async and we need to
   * initialize the Puppeteer browser instance
   * @returns {Promise} A promise for the intialized crawler
   */
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
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * @description Writes a report about the crawl
   * @todo Implement actual Report class
   * @returns {void} 
   */
  async writeReport() {
    return new Promise((resolve, reject) => {
      const readStream = new Stream.Readable()
      const writeStream = fs.createWriteStream('report.txt')
      writeStream.on('error', error => {
        reject(error)
      })
      writeStream.on('close', (event) => {
        resolve(true)
      })
      readStream.pipe(writeStream)
      for (let line of this.errors) {
        readStream.push(`${line}\n`)
      }
      // Indicating the end of data
      readStream.push(null)
    })
  }

  /**
   * @description Used by the workers to take a job from the pending queue
   * @returns {String} URL to crawl
   */
  get nextLocation() {
    const [location, ...urls] = [...this.pendingUrls]
    this.pendingUrls = new Set(urls)
    return location
  }

  /**
   * @description Orchestrator for the crawler
   * Starts the workers and wait for them all to be done
   * When everything is settled, writes a report to a file
   * @returns {Promise}
   */
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
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * @description Each time we see a link to some URL on a page, we increment a counter.
   * This is then used in the report to indicate what the website links to the most internally.
   * @param {String} url - The URL the link points to
   */
  incrementCount(url) {
    this.count[url] = (this.count[url] || 0) + 1
  }

  /**
   * @description Indicates whether or not a link is an external link
   * @param {String} url - The URL we're checking
   * @returns {Boolean}
   */
  outbound(url) {
    return URL.parse(url).host !== this.host
  }

  /**
   * @description A link is crawlable if it's never been visited before and if it's an internal link
   * @param {String} url
   * @returns {Boolean}
   */
  crawlable(url) {
    return !this.visitedUrls.has(url) && !this.outbound(url)
  }

  /**
   * @description Adds a bunch of URLs to the pending queue
   * @param {Set} urls - The URLs we encountered while crawling
   * @returns {void}
   */
  push(urls) {
    for (let url of urls) {
      this.incrementCount(url)
    }
    for (let url of [...urls].filter(url => { return this.crawlable(url) })) {
      this.pendingUrls.add(url)
    }
  }
}

// Imported in app.js
module.exports = { Crawler }