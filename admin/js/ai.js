// admin/js/ai.js — AI assist (cms-spec.md §8.3). BYOK: the key is pasted once
// in Settings, lives in localStorage, and goes only to the provider. Provider
// interface complete(prompt, content) → text, with an Anthropic adapter
// calling /v1/messages directly from the browser. Buttons, not chat.

const KEYS = { key: 'plain.aiKey', model: 'plain.aiModel' };

export const aiSettings = {
  get key() { return localStorage.getItem(KEYS.key) || ''; },
  set key(value) { value ? localStorage.setItem(KEYS.key, value) : localStorage.removeItem(KEYS.key); },
  get model() { return localStorage.getItem(KEYS.model) || 'claude-opus-4-8'; },
  set model(value) { localStorage.setItem(KEYS.model, value); },
};

export const hasKey = () => Boolean(aiSettings.key);
export const NO_KEY_HINT = 'To use the AI buttons, paste an Anthropic API key once in Settings — it stays on this device.';

/** One completion call to the Anthropic API. content: string or content blocks. */
async function complete(prompt, content, maxTokens = 1024) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': aiSettings.key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true', 'content-type': 'application/json' },
    body: JSON.stringify({ model: aiSettings.model, max_tokens: maxTokens, system: prompt, messages: [{ role: 'user', content }] }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    if (response.status === 401) throw new Error('The AI provider did not accept the key — check it in Settings.');
    if (response.status === 429) throw new Error('The AI provider is rate-limiting — wait a moment and try again.');
    throw new Error(detail.error?.message || `The AI request failed (${response.status}).`);
  }
  const data = await response.json();
  if (data.stop_reason === 'refusal') throw new Error('The AI declined this request.');
  const text = data.content.filter((block) => block.type === 'text').map((block) => block.text).join('');
  if (!text.trim()) throw new Error('The AI returned nothing — try again.');
  return text.trim();
}

export const assist = {
  /** Tighten the writing without changing its voice or meaning. */
  improve: (text) => complete(
    'You are a careful line editor. Tighten and improve the following text: fix grammar, cut filler, sharpen sentences. Preserve the author\'s voice, meaning, language, and Markdown formatting exactly. Return ONLY the improved text — no preamble, no commentary.',
    text, 4096),

  /** One SEO meta description from the body. */
  describe: (body) => complete(
    'Write one SEO meta description for the following article: a single plain-text sentence, at most 155 characters, no quotation marks, in the article\'s language. Return ONLY the description.',
    body, 256),

  /** Three title options, one per line. */
  titles: (body) => complete(
    'Suggest 3 strong titles for the following article, in its language. One per line. No numbering, no quotes, no commentary.',
    body, 256).then((text) => text.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 3)),

  /** Alt text for an image (sends the image). */
  altText: (base64, mediaType) => complete(
    'Write alt text for this image: one concise sentence describing what it shows, for someone who cannot see it. No "image of" prefix. Return ONLY the alt text.',
    [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: 'Alt text for this image, please.' },
    ], 128),

  /** Translate a whole page body (and title) into another language. */
  translate: (text, language) => complete(
    `Translate the following Markdown document into ${language}. Preserve all Markdown formatting, links, and image paths exactly. Return ONLY the translated document.`,
    text, 16000),
};
