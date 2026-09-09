/**
 * Offline Sync Queue Utilities
 * Manages offline submissions and syncing to server
 */

export interface OfflineQueueItem {
  id: string
  type: 'submission' | 'contribution'
  teamId: string
  data: Record<string, any>
  createdAt: Date
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  retries: number
  lastError?: string
}

export interface SyncResult {
  synced: number
  failed: number
  timestamp: Date
}

/**
 * Generate unique offline queue item ID
 */
export function generateQueueId(): string {
  return `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if item should retry based on retry count
 */
export function shouldRetry(item: OfflineQueueItem, maxRetries: number = 3): boolean {
  return item.retries < maxRetries
}

/**
 * Format sync status for display
 */
export function formatSyncStatus(status: OfflineQueueItem['syncStatus']): string {
  const labels: Record<string, string> = {
    pending: 'Queued',
    syncing: 'Syncing...',
    synced: 'Synced',
    failed: 'Failed',
  }
  return labels[status] || status
}

/**
 * Get queue statistics
 */
export function getQueueStats(items: OfflineQueueItem[]) {
  return {
    total: items.length,
    pending: items.filter(i => i.syncStatus === 'pending').length,
    syncing: items.filter(i => i.syncStatus === 'syncing').length,
    synced: items.filter(i => i.syncStatus === 'synced').length,
    failed: items.filter(i => i.syncStatus === 'failed').length,
  }
}
