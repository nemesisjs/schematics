/**
 * @nemesis-js/schematics - Tree
 *
 * Virtual filesystem that accumulates changes in memory before writing to disk.
 * Rules call create/update on the Tree; SchematicEngine calls commit() at the end.
 *
 * This keeps rules pure and testable — they never touch the real filesystem.
 */

import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FileEntry {
  path: string;
  content: string;
}

export type OperationType = 'CREATE' | 'UPDATE';

export interface FileOperation {
  type: OperationType;
  /** Relative path from the project root */
  path: string;
  /** Byte size of the file content */
  size: number;
}

// ── Tree ──────────────────────────────────────────────────────────────────────

export class Tree {
  private readonly _files = new Map<string, FileEntry>();
  private readonly _operations: FileOperation[] = [];

  // ── Write side ──────────────────────────────────────────────────────────────

  /**
   * Stage a new file for creation.
   * Throws if the path is already staged (use update() to modify an existing entry).
   */
  create(path: string, content: string): this {
    if (this._files.has(path)) {
      throw new Error(
        `Tree.create: file already staged — use update() instead.\n  path: ${path}`,
      );
    }
    this._files.set(path, { path, content });
    this._operations.push({ type: 'CREATE', path, size: Buffer.byteLength(content) });
    return this;
  }

  /**
   * Stage an update to an already-staged file.
   * The updater receives the current content and returns the new content.
   */
  update(path: string, updater: (current: string) => string): this {
    const entry = this._files.get(path);
    if (!entry) {
      throw new Error(`Tree.update: file not staged — use create() first.\n  path: ${path}`);
    }
    const next = updater(entry.content);
    this._files.set(path, { path, content: next });
    this._operations.push({ type: 'UPDATE', path, size: Buffer.byteLength(next) });
    return this;
  }

  /**
   * Create or update — safe upsert helper for cases where the file may or may
   * not already be staged (e.g. when a module.ts was just created by another rule).
   */
  upsert(path: string, content: string, updater?: (current: string) => string): this {
    if (this._files.has(path)) {
      return this.update(path, updater ?? (() => content));
    }
    return this.create(path, content);
  }

  // ── Read side ───────────────────────────────────────────────────────────────

  /** Read the staged content of a file, or null if not staged. */
  read(path: string): string | null {
    return this._files.get(path)?.content ?? null;
  }

  /** Returns true if the path has been staged. */
  exists(path: string): boolean {
    return this._files.has(path);
  }

  /** All staged files as an array. */
  getFiles(): FileEntry[] {
    return Array.from(this._files.values());
  }

  /** The ordered log of all CREATE/UPDATE operations. Used for CLI output. */
  getOperations(): FileOperation[] {
    return [...this._operations];
  }

  // ── Commit ──────────────────────────────────────────────────────────────────

  /**
   * Write all staged files to disk under `baseDir`.
   * Parent directories are created automatically.
   * Returns the list of relative paths written.
   */
  async commit(baseDir: string): Promise<string[]> {
    const written: string[] = [];

    for (const file of this._files.values()) {
      const fullPath = join(baseDir, file.path);
      await mkdir(dirname(fullPath), { recursive: true });
      await writeFile(fullPath, file.content, 'utf8');
      written.push(file.path);
    }

    return written;
  }
}
