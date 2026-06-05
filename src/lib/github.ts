/**
 * GitHub Contents API client for reading/writing lesson .md files.
 *
 * Uses the GitHub REST API (no SDK dependency). Each write creates a commit
 * in the configured repo. Reads are unauthenticated-friendly but we always
 * send the token for private repos.
 */

const GITHUB_TOKEN = import.meta.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN;
const GITHUB_REPO = import.meta.env.GITHUB_REPO || process.env.GITHUB_REPO; // "owner/repo"
const GITHUB_BRANCH = import.meta.env.GITHUB_BRANCH || process.env.GITHUB_BRANCH || 'main';
const LESSONS_ROOT = 'lessons';

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function apiUrl(path: string): string {
  return `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  content: string; // base64
  type: 'file' | 'dir';
}

/** List items in a directory. Returns empty array if dir doesn't exist. */
export async function listDir(dirPath: string): Promise<Array<{ name: string; type: 'file' | 'dir'; sha: string }>> {
  const url = `${apiUrl(dirPath)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub API error listing ${dirPath}: ${res.status} ${await res.text()}`);

  const data = await res.json();
  if (!Array.isArray(data)) return []; // single file, not a dir

  return data.map((item: any) => ({
    name: item.name,
    type: item.type as 'file' | 'dir',
    sha: item.sha,
  }));
}

/** Read a file. Returns null if it doesn't exist. */
export async function readFile(filePath: string): Promise<{ content: string; sha: string } | null> {
  const url = `${apiUrl(filePath)}?ref=${GITHUB_BRANCH}`;
  const res = await fetch(url, { headers: headers() });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error reading ${filePath}: ${res.status} ${await res.text()}`);

  const data = await res.json();
  // GitHub returns base64-encoded content
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  return { content, sha: data.sha };
}

/** Write (create or update) a file. Returns the new SHA. */
export async function writeFile(filePath: string, content: string, message: string): Promise<string> {
  // First check if file exists to get SHA (required for updates)
  const existing = await readFile(filePath);

  const body: Record<string, string> = {
    message,
    content: Buffer.from(content).toString('base64'),
    branch: GITHUB_BRANCH,
  };
  if (existing) {
    body.sha = existing.sha;
  }

  const res = await fetch(apiUrl(filePath), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`GitHub API error writing ${filePath}: ${res.status} ${await res.text()}`);

  const data = await res.json();
  return data.content.sha;
}

/** Check if a file exists. */
export async function fileExists(filePath: string): Promise<boolean> {
  const result = await readFile(filePath);
  return result !== null;
}

/** Get the path to a lesson stage file. */
export function lessonPath(slug: string, stage: string): string {
  return `${LESSONS_ROOT}/${slug}/${stage}.md`;
}

/** Get the path to a lesson directory. */
export function lessonDirPath(slug: string): string {
  return `${LESSONS_ROOT}/${slug}`;
}
