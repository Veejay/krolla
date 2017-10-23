const {Readable: ReadStream, Transform: TransformStream} = require('stream')
const fs = require('fs')


const transformStream = new TransformStream({objectMode: true})

transformStream._transform = function(chunk, encoding, callback) {
  const number = chunk.number
  this.push(`Number is ${number.toString()}\n`)
  callback()
}

const readStream = new ReadStream({objectMode: true})
readStream._read = () => {}

setInterval(() => {
  readStream.push({number: Math.floor(Math.random() * 100)})
}, 1000)

readStream.pipe(transformStream).pipe(process.stdout)
