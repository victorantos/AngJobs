// admin/js/media.js — the media library and the shared upload path (§7, §8.1 #4).
// Uploads commit files to media/YYYY/MM/ via the GitHub contents API.
// Hard limit 5 MB; images over 1 MB get an offer to resize in the browser
// (canvas, max 2000px) — the repo stays lean with no server pipeline.

import { putFile, listTree, fileObjectUrl, bytesToBase64 } from './github.js';
import { h, toast, ask } from './ui.js';
import { slugify } from '../lib/util.js';

export const toBase64 = (buffer) => bytesToBase64(new Uint8Array(buffer));

const MB = 1024 * 1024;

/** Downscale an image file to at most maxSize px on the long edge. */
function resizeImage(file, maxSize = 2000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not resize the image.'))), type, 0.85);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Could not read the image.'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a file into media/YYYY/MM/, committing it. Returns the site path
 * ("/media/2026/07/lake.jpg") ready to use in Markdown or an image field.
 */
export async function uploadMedia(file) {
  let blob = file;
  if (file.size > 5 * MB) throw new Error(`“${file.name}” is ${(file.size / MB).toFixed(1)} MB — the limit is 5 MB. Try resizing or compressing it first.`);
  if (file.type.startsWith('image/') && file.type !== 'image/svg+xml' && file.size > 1 * MB) {
    const shrink = await ask({
      title: 'Large image',
      message: `“${file.name}” is ${(file.size / MB).toFixed(1)} MB. Resize it to web size (max 2000px) before adding? It will look identical on screen and load much faster.`,
      actions: [{ label: 'Keep original', value: false }, { label: 'Resize it', value: true, kind: 'primary' }],
    });
    if (shrink) blob = await resizeImage(file);
  }
  const now = new Date();
  const folder = `media/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dot = file.name.lastIndexOf('.');
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || 'file';
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : 'bin';
  const base64 = toBase64(await blob.arrayBuffer());
  for (let attempt = 0; attempt < 3; attempt++) {
    const name = attempt === 0 ? `${base}.${ext}` : `${base}-${attempt + 1}.${ext}`;
    try {
      await putFile(`${folder}/${name}`, { base64 }, `media: add ${name}`);
      return `/${folder}/${name}`;
    } catch (error) {
      if (error.status !== 422) throw error; // 422 = a file with this name exists — try the next name
    }
  }
  throw new Error('A few files already have that name — rename yours and try again.');
}

export async function mediaScreen() {
  const files = (await listTree('media/')).filter((f) => !f.path.endsWith('.gitkeep'));
  const grid = h('div', { class: 'media-grid' });

  for (const file of files.slice(0, 100)) {
    const name = file.path.split('/').pop();
    const isImage = /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(name);
    const thumb = h('div', { class: 'thumb' }, isImage ? '' : '📄');
    if (isImage) {
      fileObjectUrl(file.path).then((url) => thumb.replaceChildren(h('img', { src: url, alt: '', loading: 'lazy' })))
        .catch(() => thumb.replaceChildren('🖼'));
    }
    grid.append(h('figure', { class: 'media-item' }, thumb,
      h('figcaption', {}, h('span', { class: 'media-name', title: file.path }, name), h('span', { class: 'muted' }, ` ${(file.size / 1024).toFixed(0)} KB`)),
      h('button', { onclick: () => {
        navigator.clipboard.writeText(`/${file.path}`);
        toast('Path copied. When you place it, describe the image in the alt text — screen readers depend on it.');
      } }, 'Copy path')));
  }

  const picker = h('input', { type: 'file', multiple: '', hidden: '' });
  picker.addEventListener('change', async () => {
    for (const file of picker.files) {
      try { toast(`Added ${await uploadMedia(file)}`, 'success'); } catch (error) { toast(error.message, 'error'); }
    }
    location.reload();
  });

  const screen = h('div', {},
    h('header', { class: 'screen-head' },
      h('h1', {}, 'Media'),
      h('button', { class: 'primary', onclick: () => picker.click() }, 'Upload'),
      picker),
    files.length ? grid : h('p', { class: 'empty big' }, 'No images or files yet. Anything you upload lands here, ready to use in your pages.'),
  );
  screen.addEventListener('dragover', (e) => e.preventDefault());
  screen.addEventListener('drop', async (e) => {
    e.preventDefault();
    for (const file of e.dataTransfer?.files || []) {
      try { toast(`Added ${await uploadMedia(file)}`, 'success'); } catch (error) { toast(error.message, 'error'); }
    }
  });
  return screen;
}
