const {Readable}  = require('stream')
const chalk       = require('chalk')
const fs          = require('fs')

class Report {
  constructor({visitedUrls, errors, count, path}) {
    Object.assign(this, {
      visitedUrls,
      errors,
      count,
      path
    })
  }

  generate() {
    return new Promise((resolve, reject) => {
      // const writeStream = fs.createWriteStream(this.path)
      // const readStream = new Readable({objectMode: true})

      // readStream._read = () => {
      //   // Must be implemeted, but we're pushing manually
      // }
      
      // readStream.on('error', () => {

      // })
      // readStream.on('end', () => {
      //   resolve(true)
      // })

      // TODO: Implement HTML, CSV, text formats using a TransformStream in objectMode

      //readStream.pipe(writeStream)
      const report = `
${chalk.yellow('VISITED URLS')}

${[...this.visitedUrls].map(url => {return `${url} (found ${chalk.blue.bold(this.count[url])} times while crawling)`}).join('\n')}

${chalk.red('ERRORS')}

${this.errors.size > 0 ? [...this.errors].join('\n') : chalk.white.bgGreen.bold('No errors')}

${chalk.yellow('Number of times we encountered internal links')}

${JSON.stringify(this.count, null, 2)}
`
      fs.writeFile(this.path, report, 'utf-8', error => {
        if (error) {
          reject(error)
        }
        resolve(report)
      })
      
    })
  }
}

module.exports = { Report }