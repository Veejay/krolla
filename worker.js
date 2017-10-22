const chalk = require('chalk')

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