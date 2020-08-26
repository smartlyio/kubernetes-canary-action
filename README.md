# Kubernetes canary action

An action to handle kubectl output parsing for canary deploys and rollbacks.

This will be used to provide functionality like:
- Determine if a deploy is locked after canary
- Unlock a deployment
- list available rollbacks
- Roll back a deployment

## Development

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ ...

...
```
