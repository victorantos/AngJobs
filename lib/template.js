// lib/template.js — the hand-rolled template engine (cms-spec.md §6.1).
// The complete syntax: {{ expr }} escaped, {{{ expr }}} raw,
// {{#if}}…{{else}}…{{/if}}, {{#each list as item}}…{{/each}}, {{> partial}}.
// Expressions are dot-paths only — no arbitrary JS, safe for AI generation.
// Isomorphic: strings in, strings out. Never touches the filesystem.

import { escapeHtml } from './util.js';

const TAG = /\{\{\{\s*(.+?)\s*\}\}\}|\{\{\s*(.+?)\s*\}\}/g;

/** @typedef {{type: string, text?: string, path?: string, name?: string, alias?: string, children?: Node[], alt?: Node[], inElse?: boolean}} Node */

/** Parse template source into a tree of nodes. @returns {Node[]} */
function parse(source) {
  const root = { type: 'root', children: [], alt: [] };
  const stack = [root];
  const top = () => stack[stack.length - 1];
  const emit = (node) => (top().inElse ? top().alt : top().children).push(node);
  let last = 0;
  for (const match of source.matchAll(TAG)) {
    if (match.index > last) emit({ type: 'text', text: source.slice(last, match.index) });
    last = match.index + match[0].length;
    if (match[1] !== undefined) { emit({ type: 'raw', path: match[1] }); continue; }
    const tag = match[2];
    if (tag.startsWith('#if ')) {
      const node = { type: 'if', path: tag.slice(4).trim(), children: [], alt: [], inElse: false };
      emit(node);
      stack.push(node);
    } else if (tag === 'else') {
      if (top().type !== 'if') throw new Error('template: {{else}} outside of {{#if}}');
      top().inElse = true;
    } else if (tag === '/if') {
      if (top().type !== 'if') throw new Error('template: {{/if}} without a matching {{#if}}');
      stack.pop();
    } else if (tag.startsWith('#each ')) {
      const m = tag.slice(6).trim().match(/^([\w.@-]+)\s+as\s+(\w+)$/);
      if (!m) throw new Error(`template: cannot parse "{{${tag}}}" — expected {{#each list as item}}`);
      const node = { type: 'each', path: m[1], alias: m[2], children: [], alt: [] };
      emit(node);
      stack.push(node);
    } else if (tag === '/each') {
      if (top().type !== 'each') throw new Error('template: {{/each}} without a matching {{#each}}');
      stack.pop();
    } else if (tag.startsWith('>')) {
      emit({ type: 'partial', name: tag.slice(1).trim() });
    } else {
      emit({ type: 'esc', path: tag });
    }
  }
  if (last < source.length) emit({ type: 'text', text: source.slice(last) });
  if (stack.length > 1) throw new Error(`template: unclosed {{#${top().type}}} block`);
  return root.children;
}

/** Resolve a dot-path against a stack of scopes, innermost first. */
function lookup(path, scopes) {
  const segments = path.split('.');
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i];
    if (scope != null && typeof scope === 'object' && segments[0] in scope) {
      let value = scope;
      for (const segment of segments) {
        if (value == null) return undefined;
        value = value[segment];
      }
      return value;
    }
  }
  return undefined;
}

/** Template truthiness: like JS, except an empty list is false. */
function truthy(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

const astCache = new Map();

function parseCached(source) {
  let ast = astCache.get(source);
  if (!ast) {
    ast = parse(source);
    astCache.set(source, ast);
  }
  return ast;
}

/** @param {Node[]} nodes */
function renderNodes(nodes, scopes, partials) {
  let out = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      out += node.text;
    } else if (node.type === 'esc') {
      const value = lookup(node.path, scopes);
      out += value == null ? '' : escapeHtml(String(value));
    } else if (node.type === 'raw') {
      const value = lookup(node.path, scopes);
      out += value == null ? '' : String(value);
    } else if (node.type === 'if') {
      const branch = truthy(lookup(node.path, scopes)) ? node.children : node.alt;
      out += renderNodes(branch, scopes, partials);
    } else if (node.type === 'each') {
      const list = lookup(node.path, scopes);
      if (Array.isArray(list)) {
        for (const item of list) {
          out += renderNodes(node.children, [...scopes, { [node.alias]: item }], partials);
        }
      }
    } else if (node.type === 'partial') {
      const source = partials[node.name];
      if (source == null) {
        throw new Error(`template: unknown partial "{{> ${node.name}}}" — expected templates/partials/${node.name}.html in the theme`);
      }
      out += renderNodes(parseCached(source), scopes, partials);
    }
  }
  return out;
}

/**
 * Render a template string with a context object and optional partials.
 * @param {string} source - template source
 * @param {object} context - values for dot-path expressions
 * @param {Record<string, string>} [partials] - partial name → template source
 */
export function render(source, context, partials = {}) {
  return renderNodes(parseCached(source), [context], partials);
}
