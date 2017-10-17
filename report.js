class Report {
  constructor(visitedLinks, format) {
    this.data = [...visitedLinks].sort((a, b) => {
      const bigger = a[1] > b[1]
      const smaller = a[1] < b[1]
      return bigger ? 1 : smaller ? -1 : 0
    })
    this.format = format
  }

  toText() {
    return 'TO BE IMPLEMENTED'
  }
}