# Krolla

## Description

**Krolla** is tool that uses [Puppeteer](https://github.com/GoogleChrome/puppeteer) to inform users about *Mixed Content* usage on their brand-new `https://` websites.

## TODO

- [x] Add crawling ability
- [x] Create a worker pool so that the code doesn't create millions of [Puppeteer](https://github.com/GoogleChrome/puppeteer) instances
- [x] Add jsdoc
- [x] Move class [Worker](https://github.com/Veejay/krolla/blob/d0c200f752b280e4bc45420cfb962d470813e438/crawler.js#L5) to a separate module
- [ ] Improve error handling in async chains
- [ ] Implement **actual** reporting
- [ ] Add throttling ability for slower backends
- [x] Make it so that each `worker` doesn't have to wait on others to keep on crawling
- [ ] Use [Puppeteer](https://github.com/GoogleChrome/puppeteer) further to indicate where the *Mixed Content* is located on the page