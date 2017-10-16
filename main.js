// Node modules
const puppeteer = require('puppeteer')

const EXAMPLE_URL = 'https://googlesamples.github.io/web-fundamentals/fundamentals/security/prevent-mixed-content/active-mixed-content.html'

const main = async () => {
  const browser = await puppeteer.launch({headless: true})
  const page = await browser.newPage()
  
  // Get a handle for the client used by the page object to communicate with
  // the browser through the DevTools protocol
  const devToolsClient = page._client

  let failedRequests = new Map()
  let mixedContentIssues = new Set()
  
  // Event fired when a request fired by the page failed
  page.on('requestfailed', request => {
    const {url, resourceType, method} = request
    // Store a reference to that request, we'll need to get more information
    // about Mixed Content errors later
    failedRequests.set(request._requestId, {url, resourceType, method} )
  })

  // If a request failed due to a Mixed Content issue, log it
  page._client.on('Network.loadingFailed', event => {
    if (Object.is(event.blockedReason, 'mixed-content')) {
      mixedContentIssues.add(event.requestId)
    }
  })
  
  await page.goto(EXAMPLE_URL)
  for (let requestId of mixedContentIssues.values()) {
    const {method, url, resourceType} = failedRequests.get(requestId)
    console.log(`Mixed Content warning when sending ${method} request to ${url} (${resourceType})`)
  }
  browser.close()
}
try {
  main()
} catch(error) {
  console.error(error)
}
