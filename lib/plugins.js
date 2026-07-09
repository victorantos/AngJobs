// lib/plugins.js — plugin loader + hook runner (cms-spec.md §9).
//
// A plugin is a folder in plugins/: a plugin.json manifest, an optional
// index.js exporting build-time hooks, and optional client.js / client.css
// injected into every page. Install = copy the folder + add its name to
// "plugins" in site.config.json. No npm, no registry, no build step.

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ContentError } from './content.js';

/**
 * Load every enabled plugin.
 * @returns {Promise<{name: string, dir: string, manifest: object, hooks: object, options: object}[]>}
 */
export async function loadPlugins(root, config) {
  const plugins = [];
  for (const name of config.plugins) {
    const dir = path.join(root, 'plugins', name);
    const manifestPath = path.join(dir, 'plugin.json');
    if (!fs.existsSync(manifestPath)) throw new ContentError(`plugins/${name}`, null, `plugin "${name}" is enabled in site.config.json but plugins/${name}/plugin.json doesn't exist — copy the plugin folder in, or remove "${name}" from "plugins"`);
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (error) {
      throw new ContentError(`plugins/${name}/plugin.json`, null, `invalid JSON — ${error.message}`);
    }
    let hooks = {};
    const entry = path.join(dir, 'index.js');
    if (fs.existsSync(entry)) {
      const module = await import(pathToFileURL(entry).href);
      hooks = module.default || {};
    }
    // Options: site.config.json's pluginOptions.<name> wins over manifest defaults.
    const options = { ...(manifest.options || {}), ...(config.pluginOptions?.[name] || {}) };
    plugins.push({ name, dir, manifest, hooks, options });
  }
  return plugins;
}

/** Run one hook on every plugin, in config order. A throwing plugin names itself. */
export async function runHook(plugins, hookName, ...args) {
  for (const plugin of plugins) {
    if (typeof plugin.hooks[hookName] !== 'function') continue;
    try {
      await plugin.hooks[hookName](...args, plugin.options);
    } catch (error) {
      throw new ContentError(`plugins/${plugin.name}`, null, `the "${plugin.name}" plugin failed in ${hookName}(): ${error.message}`);
    }
  }
}

/** Like runHook for renderPage: each plugin may return replacement HTML. */
export async function runRenderHook(plugins, page, html, site) {
  for (const plugin of plugins) {
    if (typeof plugin.hooks.renderPage !== 'function') continue;
    try {
      const result = await plugin.hooks.renderPage(page, html, site, plugin.options);
      if (typeof result === 'string') html = result;
    } catch (error) {
      throw new ContentError(`plugins/${plugin.name}`, null, `the "${plugin.name}" plugin failed in renderPage(): ${error.message}`);
    }
  }
  return html;
}

/**
 * Client assets to publish and inject: plugins/<name>/client.js|css →
 * /plugins/<name>/… on the site, plus the HTML snippets for every page.
 * Plugin options are exposed to client code in a JSON script tag, plus the site's named services under the reserved "$services" key.
 */
export function clientAssets(plugins, services = {}) {
  const copies = [];   // {from, to} for build.js to copy
  let head = '';       // injected before </head>
  let body = '';       // injected before </body>
  const clientOptions = {};
  for (const plugin of plugins) {
    const client = plugin.manifest.client || {};
    for (const [kind, file] of Object.entries(client)) {
      const from = path.join(plugin.dir, file);
      if (!fs.existsSync(from)) throw new ContentError(`plugins/${plugin.name}/plugin.json`, null, `declares client ${kind} "${file}" but the file doesn't exist`);
      const to = `plugins/${plugin.name}/${file}`;
      copies.push({ from, to });
      if (kind === 'css') head += `<link rel="stylesheet" href="/${to}">\n`;
      if (kind === 'js') body += `<script type="module" src="/${to}"></script>\n`;
    }
    if (client.js) clientOptions[plugin.name] = plugin.options;
  }
  if (Object.keys(services).length) clientOptions.$services = services;
  if (body) head += `<script id="plugin-options" type="application/json">${JSON.stringify(clientOptions).replace(/</g, '\\u003c')}</script>\n`; // '<' escaped so no value can close the tag
  return { copies, head, body };
}
