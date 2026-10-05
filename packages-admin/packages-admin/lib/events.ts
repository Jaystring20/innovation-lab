/**
 * Event Bus System
 * Enables loose coupling between Competition and Learning Lab modules
 * Modules can communicate without direct imports
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface EventMap {
  // Shared events
  'app:navigation-changed': { module: 'competition' | 'learning-lab'; path: string };
  'app:user-changed': { userId: string; role: string };
  'app:notification': { type: 'success' | 'error' | 'info'; message: string };

  // Competition events
  'competition:stage-updated': { stageId: string; name: string };
  'competition:submission-reviewed': { submissionId: string; score: number };
  'competition:team-created': { teamId: string; name: string };

  // Learning Lab events
  'learning-lab:level-published': { levelId: string; levelName: string };
  'learning-lab:assessment-completed': { studentId: string; assessmentId: string; score: number };
  'learning-lab:mission-submitted': { studentId: string; missionId: string };

  // Admin events
  'admin:content-saved': { module: string; contentType: string; contentId: string };
  'admin:publish-queued': { itemCount: number };
  'admin:asset-uploaded': { assetId: string; assetType: string };
}

class EventBus {
  private handlers: Map<keyof EventMap, EventHandler[]> = new Map();
  private eventHistory: Array<{ event: keyof EventMap; timestamp: number; data: any }> = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to an event
   */
  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    const wrappedHandler = async (data: EventMap[K]) => {
      await handler(data);
      this.off(event, wrappedHandler);
    };
    return this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    if (!this.handlers.has(event)) return;
    const handlers = this.handlers.get(event)!;
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  async emit<K extends keyof EventMap>(event: K, data: EventMap[K]): Promise<void> {
    // Add to history
    this.eventHistory.push({ event, timestamp: Date.now(), data });
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Execute handlers
    const handlers = this.handlers.get(event) || [];
    await Promise.all(handlers.map((handler) => handler(data)));
  }

  /**
   * Get event history (useful for debugging)
   */
  getHistory() {
    return [...this.eventHistory];
  }

  /**
   * Clear all subscriptions
   */
  clear(): void {
    this.handlers.clear();
    this.eventHistory = [];
  }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * React Hook for subscribing to events
 */
import { useEffect } from 'react';

export function useEventBus<K extends keyof EventMap>(
  event: K,
  handler: EventHandler<EventMap[K]>
) {
  useEffect(() => {
    const unsubscribe = eventBus.on(event, handler);
    return unsubscribe;
  }, [event, handler]);
}
