// admin/js/github.js — everything that talks to the GitHub REST API.
// The token lives in localStorage and never leaves the browser except
// to api.github.com (cms-spec.md §11). Every commit made here IS the
// publish mechanism — there is no other backend.

const KEYS = { repo: 'plain.repo', token: 'plain.token', branch: 'plain.branch' };

export const auth = {
  get repo() { return localStorage.getItem(KEYS.repo) || ''; },
  get token() { return localStorage.getItem(KEYS.token) || ''; },
  get branch() { return localStorage.getItem(KEYS.branch) || 'main'; },
  get signedIn() { return Boolean(this.repo && this.token); },
  save({ repo, token, branch }) {
    localStorage.setItem(KEYS.repo, repo);
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.branch, branch || 'main');
  },
  clear() { Object.values(KEYS).forEach((key) => localStorage.removeItem(key)); },
};

export class GitHubError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const FRIENDLY = {
  401: 'GitHub did not accept the access token. It may have expired — sign out and paste a fresh one.',
  403: 'GitHub refused the request. The token may lack access to this repository, or the rate limit is reached — wait a minute and try again.',
  404: 'Not found on GitHub. Check that the repository name is right and the token can read it.',
  409: 'This was edited elsewhere since you opened it.',
};

/** Call the GitHub API. Throws GitHubError with a plain-language message. */
async function gh(path, { method = 'GET', body, raw = false } = {}) {
  const headers = { Authorization: `Bearer ${auth.token}`, 'X-GitHub-Api-Version': '2022-11-28', Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json' };
  const response = await fetch(`https://api.github.com${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) {
    const detail = await response.json().then((d) => d.message || '').catch(() => '');
    const friendly = FRIENDLY[response.status] || `GitHub error ${response.status}: ${detail}`;
    throw new GitHubError(response.status, detail && !friendly.includes(detail) ? `${friendly} (GitHub said: ${detail})` : friendly);
  }
  if (response.status === 204) return null;
  return raw ? response.blob() : response.json();
}

const repoPath = (path) => `/repos/${auth.repo}/${path}`;

export function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

const encodeText = (text) => bytesToBase64(new TextEncoder().encode(text));

function decodeText(base64) {
  const binary = atob(base64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

/** Validate the token + repo pair; returns repo metadata. */
export const repoInfo = () => gh(repoPath('').slice(0, -1));

/** Read a text file. @returns {{text: string, sha: string}} */
export async function getFile(path) {
  const file = await gh(repoPath(`contents/${path}?ref=${auth.branch}`));
  return { text: decodeText(file.content), sha: file.sha };
}

/** Read a text file as it was at a specific version. */
export const getFileAt = async (path, ref) => decodeText((await gh(repoPath(`contents/${path}?ref=${ref}`))).content);

/**
 * Create or update a file — one commit. Pass `sha` when updating; a stale
 * sha throws GitHubError(409): the caller shows the conflict choices.
 * @param {string|{base64: string}} content - text, or pre-encoded binary
 */
export async function putFile(path, content, message, sha) {
  const body = { message, branch: auth.branch, content: typeof content === 'string' ? encodeText(content) : content.base64, ...(sha ? { sha } : {}) };
  const result = await gh(repoPath(`contents/${path}`), { method: 'PUT', body });
  return { sha: result.content.sha, commitSha: result.commit.sha };
}

export async function deleteFile(path, message, sha) {
  const result = await gh(repoPath(`contents/${path}`), { method: 'DELETE', body: { message, branch: auth.branch, sha } });
  return { commitSha: result.commit.sha };
}

/** List a folder. Returns [] when the folder doesn't exist yet. */
export async function listDir(path) {
  try {
    const entries = await gh(repoPath(`contents/${path}?ref=${auth.branch}`));
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    if (error.status === 404) return [];
    throw error;
  }
}

/** Every file under a prefix (recursive), via the git tree — one request. */
export async function listTree(prefix) {
  const { tree } = await gh(repoPath(`git/trees/${auth.branch}?recursive=1`));
  return tree.filter((entry) => entry.type === 'blob' && entry.path.startsWith(prefix));
}

/**
 * Write many files in ONE atomic commit (git data API) — all-or-nothing, so a
 * half-run never leaves the repo half-updated. Each entry is {path, sha}
 * (reference an existing blob — byte-exact for text or binary), {path, content}
 * (new text), or {path, delete: true} (remove it). @returns {{commitSha}}
 */
export async function commitFiles(files, message) {
  const parent = (await gh(repoPath(`git/ref/heads/${auth.branch}`))).object.sha;
  const baseTree = (await gh(repoPath(`git/commits/${parent}`))).tree.sha;
  const tree = await Promise.all(files.map(async (f) => {
    if (f.delete) return { path: f.path, mode: '100644', type: 'blob', sha: null };
    const sha = f.sha ?? (await gh(repoPath('git/blobs'), { method: 'POST', body: { content: f.base64 ?? bytesToBase64(new TextEncoder().encode(f.content)), encoding: 'base64' } })).sha;
    return { path: f.path, mode: '100644', type: 'blob', sha };
  }));
  const newTree = await gh(repoPath('git/trees'), { method: 'POST', body: { base_tree: baseTree, tree } });
  const commit = await gh(repoPath('git/commits'), { method: 'POST', body: { message, tree: newTree.sha, parents: [parent] } });
  await gh(repoPath(`git/refs/heads/${auth.branch}`), { method: 'PATCH', body: { sha: commit.sha } });
  return { commitSha: commit.sha };
}

/** Fetch a repo file as a blob object URL (for previewing not-yet-deployed media). */
export async function fileObjectUrl(path) {
  const blob = await gh(repoPath(`contents/${path}?ref=${auth.branch}`), { raw: true });
  return URL.createObjectURL(blob);
}

/** Commits touching a path, newest first. Pass '' for the whole site. */
export async function commitsFor(path, perPage = 30) {
  const params = new URLSearchParams({ sha: auth.branch, per_page: perPage });
  if (path) params.set('path', path);
  const commits = await gh(repoPath(`commits?${params}`));
  return commits.map((c) => ({ sha: c.sha, date: c.commit.committer.date, message: c.commit.message.split('\n')[0], author: c.commit.author?.name || c.author?.login || '' }));
}

/** The workflow run building a commit, or null if none has started yet. */
export async function runFor(commitSha) {
  const { workflow_runs: runs } = await gh(repoPath(`actions/runs?head_sha=${commitSha}&per_page=1`));
  return runs[0] || null;
}

/** Trigger a workflow_dispatch run (used by the update banner, §14.5). */
export const dispatchWorkflow = (file, ref = auth.branch) => gh(repoPath(`actions/workflows/${file}/dispatches`), { method: 'POST', body: { ref } });

/** Compare dotted semver strings a and b. Returns -1 / 0 / 1. */
export function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0) ? -1 : 1;
  return 0;
}
