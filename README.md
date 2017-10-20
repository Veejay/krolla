# Krolla

## Description

**Krolla** is tool that uses [Puppeteer](https://github.com/GoogleChrome/puppeteer) to inform users about *Mixed Content* usage on their brand-new `https://` websites.

## TODO

- [x] Add crawling ability
- [x] Create a worker pool so that the code doesn't create millions of Puppeteer instances
- [ ] Use [Puppeteer](https://github.com/GoogleChrome/puppeteer) further to indicate where the *Mixed Content* is located on the page
- [ ] Actually handle `maxRadius`
- [ ] `failedRequests` and `mixedContentIssues` should be wrapped in a common class exposing `get`/`set`