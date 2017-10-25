const uuid = require('uuid')
class Queue {
  constructor(values) {
    this._values = values

  }

  get values() {
    let iterator = (function* generator(queue) {
      const [head, ...tail] = queue._values
      if (Object.is(head, null)) {
        return true
      }
      queue._values = tail
      yield head
    })(this)
    return iterator
  }

  push(value) {
    this._values.push(value)
  }
}

const queue = new Queue([1,2,3,4])

const addValues = (index) => {
  queue.push(uuid.v4())
  if (index < 5) {
    setTimeout(() => {
      addValues(index + 1)
    }, Math.ceil(Math.random() * 4000))
  } else {
    queue.push(null)
  }
}

addValues(0)
setTimeout(() => {
  addValues(0)
}, 1000)
setTimeout(() => {
  addValues(0)
}, 200)
let value = ''
const main = (queue) => {
  const value = queue.values.next()
  if (value.done) {
    return true
  } else {
    setTimeout(() => {
      console.log(value.value)
      main(queue)
    }, Math.ceil(Math.random() * 1000))
  }
}

main(queue)
