// Feedback — the owner's view of messages the widget collected.
//
// An admin screen contributed by this plugin (§9 admin surface). The context
// supplies `dataScreen`, which resolves the named service, authenticates with
// the site's GitHub sign-in and handles loading, 401 re-prompting, errors and
// refresh — so this file is only the shape of the data.

const when = (s) => { const d = new Date(s); return isNaN(d) ? String(s || '') : d.toLocaleString(); };

export default {
  screens: {
    feedback: ({ h, dataScreen, options }) => dataScreen({
      title: 'Feedback',
      path: '/feedback?limit=200',
      service: options.service || 'backend',
      hint: 'By default this uses your GitHub sign-in. If it wasn’t accepted, you either lack push access to this repo or the backend uses its own admin token — paste that below.',
      render: (data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        if (!items.length) return h('p', { class: 'muted' }, 'No feedback yet. Messages sent from the widget will appear here.');
        return h('div', { class: 'feedback-list' }, items.map((it) => h('article', { class: 'feedback-item' },
          h('p', { class: 'feedback-msg' }, it.message || ''),
          h('p', { class: 'feedback-meta' }, [it.email, it.page, when(it.createdAt)].filter(Boolean).join(' · ')))));
      },
    }),
  },
};
