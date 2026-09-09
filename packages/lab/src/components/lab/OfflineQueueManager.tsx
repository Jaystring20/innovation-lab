import { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import { getUploadQueue, processUploadQueue, isOnline, QueuedUpload } from '@/lib/uploads';
import GlowButton from '@/components/GlowButton';
import Panel from '@/components/Panel';

/**
 * OfflineQueueManager — shows pending uploads and handles retry when online.
 * Mounted at the app level to monitor network status.
 */
const OfflineQueueManager: React.FC = () => {
  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [online, setOnline] = useState(isOnline());
  const [retrying, setRetrying] = useState(false);

  // Monitor network status
  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }
    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load queue on mount and periodically
  useEffect(() => {
    const current = getUploadQueue();
    setQueue(current);

    const interval = setInterval(() => {
      const updated = getUploadQueue();
      setQueue(updated);
    }, 5000); // Check every 5s

    return () => clearInterval(interval);
  }, []);

  // Auto-retry when coming back online
  useEffect(() => {
    if (online && queue.length > 0 && !retrying) {
      const timer = setTimeout(() => {
        handleRetry();
      }, 2000); // Wait 2s before retrying
      return () => clearTimeout(timer);
    }
  }, [online, queue.length, retrying]);

  async function handleRetry() {
    if (retrying) return;
    setRetrying(true);
    try {
      await processUploadQueue((updated) => setQueue(updated));
    } finally {
      setRetrying(false);
    }
  }

  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-40">
      <Panel className="space-y-3" hover={false}>
        {/* Header */}
        <div className="flex items-start gap-3">
          {online ? (
            <Wifi className="w-5 h-5 text-ok flex-shrink-0 mt-0.5" />
          ) : (
            <WifiOff className="w-5 h-5 text-warn flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground text-sm">
              {queue.length} upload{queue.length !== 1 ? 's' : ''} pending
            </p>
            <p className="text-xs text-muted-foreground">
              {online ? 'Retrying now…' : 'Will retry when online'}
            </p>
          </div>
        </div>

        {/* Queue items */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {queue.map((item) => (
            <div
              key={item.id}
              className="bg-secondary/40 border border-border rounded py-2 px-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warn flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">
                    {item.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attempt {item.attempts + 1}/3
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        {!online && (
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-60 transition-colors"
          >
            {retrying ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Retrying…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Retry now
              </span>
            )}
          </button>
        )}
      </Panel>
    </div>
  );
};

export default OfflineQueueManager;
