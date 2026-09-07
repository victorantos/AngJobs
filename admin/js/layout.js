// admin/js/layout.js — the editor's page-layout picker. A page may override its
// collection's template with a frontmatter `template:` (e.g. `landing`); a field
// tagged "showFor" appears only under a matching layout, so hero fields don't
// clutter ordinary pages.

import { getFile } from './github.js';
import { h } from './ui.js';

/** The theme's selectable page layouts, from its theme.json ([] if none/unreadable). */
export async function themeLayouts(theme) {
  try { return JSON.parse((await getFile(`themes/${theme}/theme.json`)).text).layouts || []; }
  catch { return []; }
}

/** Whether a field is visible under `template` — a field with no "showFor" always is. */
export const showsFor = (field, template) => !field.showFor
  || (Array.isArray(field.showFor) ? field.showFor : [field.showFor]).includes(template);

/**
 * The Layout <select>, or null when there's no real choice (fewer than two layouts,
 * or this collection's own template isn't one of them). onPick(template) fires on change.
 */
export function layoutPicker(layouts, current, collectionTemplate, onPick) {
  if (layouts.length <= 1 || !layouts.includes(collectionTemplate)) return null;
  const select = h('select', {}, layouts.map((l) =>
    h('option', { value: l, selected: l === current ? '' : null }, `${l[0].toUpperCase()}${l.slice(1)}`)));
  select.addEventListener('change', () => onPick(select.value));
  return h('label', { class: 'field' }, 'Layout', select);
}
