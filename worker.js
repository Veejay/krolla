const chalk = require('chalk')

/** 
 * @description A worker object represents the individual concurrent Puppeteer instances
 * actually doing the page crawling
*/
 class Worker {
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

  /**
   * @description Initializes the puppeteer instance, since constructor can't be async
   * @param {Integer} index - Index of the worker in the worker pool, used for debugging purposes
   * @returns {Promise} A promise for the worker instance
   */
  async init(index) {
    this.name = `worker_${index}`
    console.log(`${chalk.yellow('Initializing')} ${this.name}`)
    return new Promise(async (resolve, reject) => {
      this.page = await this.browser.newPage()
      resolve(this)
    })
  }

  /**
   * @description Used to avoid repeated pops on the pending queue when the crawling begins
   * @param {Integer} timeout - The time the worker will be paused before trying to pop URLs from the pending queue again (in milliseconds) 
   */
  async sleep(timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, timeout)
    })
  }

  /**
   * @description Starts the worker process: popping URLs from the queue and crawling them. Stops when the crawling is done.
   * @returns {Promise} A promise which will resolve when the crawling is done 
   */
  async run() {
    return new Promise(async (resolve, reject) => {
      let location = ''
      while (!this.crawler.done) {
        try {
          location = this.crawler.nextLocation
          if (this.crawler.locked.has(location)) {
            continue
          }
          if (typeof location === 'undefined') {
            this.done = true
            await this.sleep(2000)
          } else {
            this.done = false
            console.log(`${chalk.bgBlue.white.bold(this.name)}\tvisiting ${chalk.green(location)}`)
            this.crawler.locked.add(location)
            await this.sleep(1000)
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

module.exports = { Worker }