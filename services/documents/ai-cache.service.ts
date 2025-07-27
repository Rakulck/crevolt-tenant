// Shared AI cache service - no specific type dependencies
// Remove this import as we'll define AICacheEntry locally
// import { AICacheEntry } from '../types/metadata';

import type { HeaderDetectionResult } from "@/lib/types/underwriting/rent-roll/types";

interface AICacheEntry {
  key: string;
  headerDetection: HeaderDetectionResult;
  timestamp: number;
  expiresAt: number;
}

// Simple in-memory cache for demonstration
// In production, this could be Redis, Database, or file-based
/**
 * Shared AI caching service for OpenAI API responses
 * Provides in-memory caching with TTL to reduce API costs
 */
class AICacheService {
  private cache = new Map<string, AICacheEntry>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  generateKey(fileCharacteristics: {
    name: string;
    size: number;
    firstRowsHash: string;
  }): string {
    const { name, size, firstRowsHash } = fileCharacteristics;
    // Create a deterministic key based on file characteristics
    return `${name}_${size}_${firstRowsHash}`.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  hashFirstRows(rows: unknown[][]): string {
    // Create a simple hash of the first few rows for cache key
    const firstRows = rows.slice(0, 10);
    const content = firstRows
      .map((row) => row.map((cell) => String(cell || "")).join("|"))
      .join("\n");

    // Simple hash function (in production, use a proper hash library)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  async get(key: string): Promise<HeaderDetectionResult | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log(`Cache hit for key: ${key}`);
    return entry.headerDetection;
  }

  async set(key: string, headerDetection: HeaderDetectionResult): Promise<void> {
    const entry: AICacheEntry = {
      key,
      headerDetection,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION,
    };

    this.cache.set(key, entry);
    console.log(`Cache stored for key: ${key}`);

    // Clean up expired entries periodically
    this.cleanupExpired();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const aiCacheService = new AICacheService();
