exports.config = {
  allScriptsTimeout: 11000,

  specs: [
    'e2e/*.js'
  ],

  capabilities: {
      'browserName': 'chrome',
      'chromeOptions': {
          'args': ['--test-type']
      }
  },

  chromeOnly: true,

  baseUrl: 'http://localhost:33652/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    defaultTimeoutInterval: 30000
  }
};
