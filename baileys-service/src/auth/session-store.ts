/**
 * Session Store untuk Baileys WhatsApp Authentication
 *
 * Mengelola penyimpanan auth state menggunakan useMultiFileAuthState dari Baileys.
 * Mendukung operasi backup dan restore untuk pemulihan session.
 */

import {
  useMultiFileAuthState,
  AuthenticationState,
} from "@whiskeysockets/baileys";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";

const mkdir = promisify(fs.mkdir);
const rm = promisify(fs.rm);
const copyFile = promisify(fs.copyFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const chmod = promisify(fs.chmod);

/**
 * Return type dari initialize()
 */
export interface SessionAuthState {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
}

/**
 * Session metadata untuk tracking
 */
export interface SessionMetadata {
  sessionId: string;
  createdAt: Date;
  lastUsedAt: Date;
  backupCount: number;
}

/**
 * SessionStore - Mengelola penyimpanan session auth Baileys
 *
 * Path session di-gitignore dan file permissions di-set ke 600
 * untuk keamanan credentials.
 */
export class SessionStore {
  private readonly sessionPath: string;
  private readonly sessionId: string;
  private readonly credsFile = "creds.json";
  private readonly metadataFile = "session-metadata.json";

  constructor(basePath: string, sessionId: string) {
    this.sessionId = this.sanitizeSessionId(sessionId);
    this.sessionPath = path.join(basePath, this.sessionId);
  }

  /**
   * Sanitize session ID untuk mencegah path traversal
   */
  private sanitizeSessionId(sessionId: string): string {
    // Hapus karakter berbahaya dan path traversal attempts
    return sessionId
      .replace(/\.\./g, "")
      .replace(/[\/\\:*?"<>|]/g, "_")
      .slice(0, 64); // Limit panjang
  }

  /**
   * Initialize auth state menggunakan useMultiFileAuthState
   *
   * @returns Object dengan state dan saveCreds callback
   */
  async initialize(): Promise<SessionAuthState> {
    // 1. Ensure directory exists dengan permissions yang aman
    await this.ensureDirectory();

    // 2. Call useMultiFileAuthState
    const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

    // 3. Set file permissions ke 600 (hanya owner yang bisa read/write)
    await this.secureFilePermissions();

    // 4. Update metadata
    await this.updateMetadata();

    // 5. Return state dan wrapped saveCreds
    return {
      state,
      saveCreds: async () => {
        await saveCreds();
        await this.secureFilePermissions();
        await this.updateLastUsed();
      },
    };
  }

  /**
   * Ensure session directory exists dengan permissions yang aman
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await mkdir(this.sessionPath, { recursive: true, mode: 0o700 });
    } catch (err: unknown) {
      // Ignore jika sudah ada
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") {
        throw err;
      }
    }
  }

  /**
   * Set file permissions ke 600 untuk semua file dalam session directory
   */
  private async secureFilePermissions(): Promise<void> {
    try {
      const files = await readdir(this.sessionPath);
      for (const file of files) {
        const filePath = path.join(this.sessionPath, file);
        const fileStat = await stat(filePath);
        if (fileStat.isFile()) {
          await chmod(filePath, 0o600);
        }
      }
    } catch {
      // Ignore errors - directory mungkin belum ada files
    }
  }

  /**
   * Check apakah session sudah ada (creds.json exists)
   */
  sessionExists(): boolean {
    const credsPath = path.join(this.sessionPath, this.credsFile);
    return fs.existsSync(credsPath);
  }

  /**
   * Check apakah session directory exists
   */
  directoryExists(): boolean {
    return fs.existsSync(this.sessionPath);
  }

  /**
   * Get session path
   */
  getSessionPath(): string {
    return this.sessionPath;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Delete session secara aman
   *
   * Menghapus seluruh session directory dan isinya
   */
  async deleteSession(): Promise<void> {
    if (!this.directoryExists()) {
      return; // Session sudah tidak ada
    }

    try {
      // Gunakan rm recursive untuk hapus folder dan semua isinya
      await rm(this.sessionPath, { recursive: true, force: true });
    } catch (err: unknown) {
      const error = err as NodeJS.ErrnoException;
      // Re-throw kecuali error ENOENT (file not found)
      if (error.code !== "ENOENT") {
        throw new Error(`Gagal menghapus session: ${error.message}`);
      }
    }
  }

  /**
   * Backup session ke folder dengan timestamp
   *
   * @returns Path ke folder backup
   */
  async backupSession(): Promise<string> {
    if (!this.sessionExists()) {
      throw new Error("Session tidak ditemukan, tidak bisa backup");
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = `${this.sessionPath}_backup_${timestamp}`;

    try {
      // Buat backup directory
      await mkdir(backupDir, { recursive: true, mode: 0o700 });

      // Copy semua file dari session directory
      const files = await readdir(this.sessionPath);
      for (const file of files) {
        const srcPath = path.join(this.sessionPath, file);
        const destPath = path.join(backupDir, file);

        const fileStat = await stat(srcPath);
        if (fileStat.isFile()) {
          await copyFile(srcPath, destPath);
          await chmod(destPath, 0o600);
        }
      }

      // Update metadata untuk track backup count
      await this.incrementBackupCount();

      return backupDir;
    } catch (err: unknown) {
      // Cleanup backup directory jika gagal
      try {
        await rm(backupDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
      throw new Error(`Gagal backup session: ${(err as Error).message}`);
    }
  }

  /**
   * Restore session dari backup
   *
   * @param backupPath - Path ke folder backup
   */
  async restoreFromBackup(backupPath: string): Promise<void> {
    // Validasi backup path exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup tidak ditemukan: ${backupPath}`);
    }

    // Validasi backup memiliki creds.json
    const backupCredsPath = path.join(backupPath, this.credsFile);
    if (!fs.existsSync(backupCredsPath)) {
      throw new Error("Backup tidak valid: creds.json tidak ditemukan");
    }

    // Validasi backup path berada di parent directory yang sama (security)
    const backupParent = path.dirname(backupPath);
    const sessionParent = path.dirname(this.sessionPath);
    if (backupParent !== sessionParent) {
      throw new Error(
        "Backup harus berada di direktori yang sama dengan session",
      );
    }

    try {
      // Hapus session yang ada
      await this.deleteSession();

      // Buat session directory baru
      await this.ensureDirectory();

      // Copy semua file dari backup
      const files = await readdir(backupPath);
      for (const file of files) {
        const srcPath = path.join(backupPath, file);
        const destPath = path.join(this.sessionPath, file);

        const fileStat = await stat(srcPath);
        if (fileStat.isFile()) {
          await copyFile(srcPath, destPath);
          await chmod(destPath, 0o600);
        }
      }

      // Update metadata
      await this.updateMetadata();
    } catch (err: unknown) {
      throw new Error(`Gagal restore dari backup: ${(err as Error).message}`);
    }
  }

  /**
   * List semua backup yang tersedia untuk session ini
   *
   * @returns Array of backup paths sorted by date (newest first)
   */
  async listBackups(): Promise<string[]> {
    const parentDir = path.dirname(this.sessionPath);
    const backupPrefix = `${this.sessionId}_backup_`;

    try {
      const entries = await readdir(parentDir);
      const backups = entries
        .filter((entry) => entry.startsWith(backupPrefix))
        .map((entry) => path.join(parentDir, entry))
        .sort()
        .reverse(); // Newest first

      return backups;
    } catch {
      return [];
    }
  }

  /**
   * Hapus backup lama, simpan hanya N backup terbaru
   *
   * @param keepCount - Jumlah backup yang disimpan (default: 3)
   */
  async cleanupOldBackups(keepCount: number = 3): Promise<number> {
    const backups = await this.listBackups();
    const toDelete = backups.slice(keepCount);

    let deletedCount = 0;
    for (const backupPath of toDelete) {
      try {
        await rm(backupPath, { recursive: true, force: true });
        deletedCount++;
      } catch {
        // Ignore individual delete errors
      }
    }

    return deletedCount;
  }

  /**
   * Get session metadata
   */
  async getMetadata(): Promise<SessionMetadata | null> {
    const metadataPath = path.join(this.sessionPath, this.metadataFile);

    try {
      const data = fs.readFileSync(metadataPath, "utf-8");
      const metadata = JSON.parse(data);
      return {
        ...metadata,
        createdAt: new Date(metadata.createdAt),
        lastUsedAt: new Date(metadata.lastUsedAt),
      };
    } catch {
      return null;
    }
  }

  /**
   * Update session metadata
   */
  private async updateMetadata(): Promise<void> {
    const metadataPath = path.join(this.sessionPath, this.metadataFile);
    const existing = await this.getMetadata();

    const metadata: SessionMetadata = {
      sessionId: this.sessionId,
      createdAt: existing?.createdAt || new Date(),
      lastUsedAt: new Date(),
      backupCount: existing?.backupCount || 0,
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    await chmod(metadataPath, 0o600);
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata) {
      const metadataPath = path.join(this.sessionPath, this.metadataFile);
      metadata.lastUsedAt = new Date();
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
  }

  /**
   * Increment backup count dalam metadata
   */
  private async incrementBackupCount(): Promise<void> {
    const metadata = await this.getMetadata();
    if (metadata) {
      const metadataPath = path.join(this.sessionPath, this.metadataFile);
      metadata.backupCount++;
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
  }
}

/**
 * Factory function untuk membuat SessionStore instance
 */
export function createSessionStore(
  basePath: string,
  sessionId: string,
): SessionStore {
  return new SessionStore(basePath, sessionId);
}

/**
 * Default session base path
 */
export const DEFAULT_SESSION_BASE_PATH = "./sessions/baileys";
