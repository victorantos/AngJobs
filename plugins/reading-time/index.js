/**
 * reading-time — adds `item.readingTime` (e.g. "3 min read") to every
 * content item. Runs in transformContent, so the value rides along into
 * templates ({{ page.readingTime }} / {{ item.readingTime }}) and the
 * JSON API.
 */

/**
 * Count the words a reader actually reads in a Markdown body.
 * Code blocks and raw URLs are skimmed, not read, so they are dropped;
 * everything else counts as whitespace-separated words.
 * @param {string} markdown raw Markdown body
 * @returns {number} word count
 */
function countWords(markdown) {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/`[^`\n]*`/g, ' ')      // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')        // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')      // links → keep the label
    .replace(/<[^>]+>/g, ' ');       // inline HTML tags
  return text.split(/\s+/).filter(Boolean).length;
}

export default {
  /**
   * @param {object} item content item; item.body is raw Markdown
   * @param {object} site {config, data, collections}
   * @param {object} options {wordsPerMinute}
   */
  transformContent(item, site, options) {
    const wordsPerMinute = Number(options.wordsPerMinute) > 0
      ? Number(options.wordsPerMinute)
      : 200;
    const minutes = Math.max(1, Math.ceil(countWords(item.body || '') / wordsPerMinute));
    item.readingTime = `${minutes} min read`;
  },
};
