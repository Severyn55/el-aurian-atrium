/**
 * GitHub Client (Admin)
 *
 * Zentrale Abstraktion für alle GitHub Contents / Git Data API Aufrufe.
 * Ziel: Weniger Duplizierung, bessere Fehlerbehandlung.
 *
 * WICHTIG: Diese Schicht kennt immer noch den PAT direkt (wie im Original).
 */

import { utf8ToBase64 } from './utils';
import { GITHUB_USER_AGENT } from './constants';
import type { CommitResult } from './types';

export interface GitHubClientOptions {
  token: string;
  repo: string; // "owner/repo"
}

export class GitHubClient {
  private token: string;
  private repo: string;

  constructor(opts: GitHubClientOptions) {
    this.token = opts.token.trim();
    this.repo = opts.repo.trim();
  }

  private getAuthHeader(): string {
    return this.token.startsWith('github_pat_')
      ? `Bearer ${this.token}`
      : `token ${this.token}`;
  }

  private getHeaders(accept = 'application/vnd.github.v3+json') {
    return {
      'Authorization': this.getAuthHeader(),
      'Accept': accept,
      'Content-Type': 'application/json',
      'User-Agent': GITHUB_USER_AGENT,
    };
  }

  /**
   * Lädt eine Datei raw + sha (verwendet für die meisten Editoren).
   */
  async loadFile(path: string): Promise<{ content: string; sha: string | null; raw: string }> {
    const authHeader = this.getAuthHeader();
    const url = `https://api.github.com/repos/${this.repo}/contents/${path}`;

    const res = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': GITHUB_USER_AGENT,
      },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Load failed ${res.status}: ${t}`);
    }

    const content = await res.text();
    // SHA muss separat geholt werden (raw response hat keinen sha)
    const sha = await this.getFileSha(path);

    return { content, sha, raw: content };
  }

  /**
   * Holt den aktuellen SHA einer Datei (wichtig für Updates).
   */
  async getFileSha(path: string): Promise<string | null> {
    const url = `https://api.github.com/repos/${this.repo}/contents/${path}`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      const t = await res.text().catch(() => '');
      throw new Error(`getFileSha failed ${res.status}: ${t}`);
    }

    const data = await res.json();
    return data.sha || null;
  }

  /**
   * Einfacher Commit via Contents API (die meisten Editoren).
   */
  async commitFile(
    path: string,
    content: string,
    message: string,
    sha?: string | null,
    isBase64 = false
  ): Promise<CommitResult> {
    const url = `https://api.github.com/repos/${this.repo}/contents/${path}`;

    const body: any = {
      message,
      content: isBase64 ? content : utf8ToBase64(content),
    };

    if (sha) body.sha = sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    const text = await putRes.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!putRes.ok) {
      throw new Error(data.message || text);
    }

    return data;
  }

  // ============================================
  // Advanced Git Data API methods (for atomic multi-file commits, esp. portraits)
  // ============================================

  /**
   * Creates a blob (used for atomic portrait uploads).
   */
  async createGitBlob(content: string, encoding: 'utf-8' | 'base64' = 'utf-8'): Promise<string> {
    const res = await fetch(`https://api.github.com/repos/${this.repo}/git/blobs`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content, encoding })
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Blob creation failed: ${res.status} ${t}`);
    }
    const json = await res.json();
    return json.sha;
  }

  /**
   * Gets the latest SHA for a path (more reliable in some cases than contents API).
   */
  async getLatestSha(path: string): Promise<string | null> {
    const url = `https://api.github.com/repos/${this.repo}/contents/${path}`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`SHA fetch failed for ${path} (${res.status}): ${t}`);
    }
    try {
      const json = await res.json();
      return json.sha || null;
    } catch (parseErr) {
      return null;
    }
  }

  /**
   * Atomic commit for portraits (image + yaml update in one commit using Git Data API).
   * This prevents partial states.
   */
  async commitPortraitAtomic(
    base64Image: string,
    safeName: string,
    yamlContent: string,
    commitMessage: string
  ): Promise<{ commit: any }> {
    const headers = this.getHeaders();

    // 1. Create blobs
    const imageBlobSha = await this.createGitBlob(base64Image, 'base64');
    const yamlBlobSha = await this.createGitBlob(utf8ToBase64(yamlContent), 'base64');

    // 2. Get current main ref
    const refRes = await fetch(`https://api.github.com/repos/${this.repo}/git/ref/heads/main`, { headers });
    if (!refRes.ok) throw new Error('Could not get current ref');
    const currentRef = await refRes.json();
    const currentCommitSha = currentRef.object.sha;

    // 3. Get current commit to find base tree
    const commitRes = await fetch(`https://api.github.com/repos/${this.repo}/git/commits/${currentCommitSha}`, { headers });
    if (!commitRes.ok) throw new Error('Could not get current commit');
    const currentCommit = await commitRes.json();
    const baseTreeSha = currentCommit.tree.sha;

    // 4. Create new tree with both files
    const treeRes = await fetch(`https://api.github.com/repos/${this.repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: [
          {
            path: `src/assets/images/portraits/${safeName}`,
            mode: '100644',
            type: 'blob',
            sha: imageBlobSha
          },
          {
            path: 'src/content/begegnungen/portraits.yaml',
            mode: '100644',
            type: 'blob',
            sha: yamlBlobSha
          }
        ]
      })
    });
    if (!treeRes.ok) {
      const t = await treeRes.text().catch(() => '');
      throw new Error(`Tree creation failed: ${treeRes.status} ${t}`);
    }
    const newTree = await treeRes.json();

    // 5. Create commit
    const newCommitRes = await fetch(`https://api.github.com/repos/${this.repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTree.sha,
        parents: [currentCommitSha]
      })
    });
    if (!newCommitRes.ok) {
      const t = await newCommitRes.text().catch(() => '');
      throw new Error(`Commit creation failed: ${newCommitRes.status} ${t}`);
    }
    const newCommit = await newCommitRes.json();

    // 6. Update the main ref (fast-forward)
    const updateRes = await fetch(`https://api.github.com/repos/${this.repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommit.sha,
        force: false
      })
    });
    if (!updateRes.ok) {
      const t = await updateRes.text().catch(() => '');
      throw new Error(`Ref update failed: ${updateRes.status} ${t}`);
    }

    return { commit: newCommit };
  }

  /**
   * Helper to get sha if needed (with fallback).
   */
  async getFileShaIfNeeded(path: string): Promise<string | null> {
    try {
      return await this.getFileSha(path);
    } catch (e) {
      console.warn('getFileSha failed for ' + path, e);
      return null;
    }
  }
}
