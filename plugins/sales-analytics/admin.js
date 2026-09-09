// Insights — page views and CTA clicks this plugin's tracking recorded.
//
// An admin screen contributed by this plugin (§9 admin surface); `dataScreen`
// from the context does the fetching, auth and error handling.

const num = (n) => Number(n || 0).toLocaleString('en-US');
const pct = (a, b) => `${b ? Math.round((a / b) * 1000) / 10 : 0}%`;

export default {
  screens: {
    insights: ({ h, dataScreen, options }) => dataScreen({
      title: 'Insights',
      path: '/reports',
      service: options.service || 'backend',
      hint: 'By default this uses your GitHub sign-in. If it wasn’t accepted, you either lack push access to this repo or the backend uses its own admin token — paste that below.',
      render: (data) => {
        const pages = (Array.isArray(data.pages) ? data.pages : []).slice().sort((a, b) => (b.views || 0) - (a.views || 0));
        const views = pages.reduce((n, p) => n + (p.views || 0), 0);
        const clicks = pages.reduce((n, p) => n + (p.clicks || 0), 0);
        const tile = (label, value) => h('div', { class: 'stat' }, h('div', { class: 'stat-value' }, value), h('div', { class: 'stat-label' }, label));
        const rows = pages.map((p) => h('tr', {},
          h('td', {}, p.page || ''), h('td', { class: 'num' }, num(p.views)), h('td', { class: 'num' }, num(p.clicks)),
          h('td', { class: 'num' }, pct(p.clicks, p.views)), h('td', {}, (p.ctas || []).map((x) => `${x.cta} ${num(x.clicks)}`).join(', '))));
        return h('div', {},
          h('div', { class: 'stats' }, tile('Views', num(views)), tile('CTA clicks', num(clicks)), tile('Click-through', pct(clicks, views))),
          h('table', { class: 'data-table' },
            h('thead', {}, h('tr', {}, h('th', {}, 'Page'), h('th', { class: 'num' }, 'Views'), h('th', { class: 'num' }, 'Clicks'), h('th', { class: 'num' }, 'CTR'), h('th', {}, 'By CTA'))),
            h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { class: 'muted', colspan: '5' }, 'No events recorded yet.')))));
      },
    }),
  },
};
