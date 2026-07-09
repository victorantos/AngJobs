// contact-form plugin — reference implementation of a renderPage hook.
// Write [[contact-form]] anywhere in a page's Markdown and it becomes a
// working form. The form is plain HTML that POSTs to options.endpoint, so
// it works with JavaScript disabled (client.js only adds inline submission).

const MARKER = '[[contact-form]]';

function formHtml(endpoint, successMessage) {
  if (!endpoint) {
    return '<p><em>The contact form isn’t configured yet: set "pluginOptions": { "contact-form": { "endpoint": "https://…" } } in site.config.json (for example a Formspree form address).</em></p>';
  }
  return `<form class="contact-form" method="POST" action="${endpoint}" data-success="${successMessage}">
  <label>Your name <input type="text" name="name" required></label>
  <label>Your email <input type="email" name="email" required></label>
  <label>Message <textarea name="message" rows="6" required></textarea></label>
  <button type="submit">Send</button>
</form>`;
}

export default {
  renderPage(page, html, site, options) {
    if (!html.includes(MARKER)) return html;
    return html.replaceAll(MARKER, formHtml(options.endpoint, options.successMessage));
  },
};
