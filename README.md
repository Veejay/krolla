# Krolla

## Description

**Krolla** is tool that uses [Puppeteer](https://github.com/GoogleChrome/puppeteer) to inform users about *Mixed Content* usage on their brand-new `https://` websites.

## TODO

### First version

- [x] Add crawling ability
- [x] Create a worker pool so that the code doesn't create millions of [Puppeteer](https://github.com/GoogleChrome/puppeteer) instances
- [x] Add jsdoc
- [x] Move class Worker to a separate module
- [x] Improve error handling in async chains
- [x] Implement **actual** reporting
- [x] Make it so that each `worker` doesn't have to wait on others to keep on crawling
- [x] Use [Puppeteer](https://github.com/GoogleChrome/puppeteer) further to report *Mixed Content*

### Second version

- [ ] Cleanup / refactoring
- [ ] Add throttling capabilities
- [ ] Explore streams
- [ ] Explore generators to implement the pending urls queue