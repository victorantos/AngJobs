// goatcounter plugin — appends the GoatCounter counter script (a request to
// the third-party gc.zgo.at; page views only, no cookies). With JavaScript
// disabled nothing loads and the page is unaffected.

const options = JSON.parse(document.getElementById('plugin-options')?.textContent || '{}').goatcounter || {};
if (options.code) {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${options.code}.goatcounter.com/count`;
  document.head.append(script);
}
