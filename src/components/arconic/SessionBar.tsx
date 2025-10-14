import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, X } from 'lucide-react';

interface SessionBarProps {
  maxDuration?: number; // in seconds
  onEnd: () => void;
  scenarioTitle: string;
}

export const SessionBar = ({ maxDuration, onEnd, scenarioTitle }: SessionBarProps) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-end if max duration reached
  useEffect(() => {
    if (maxDuration && elapsed >= maxDuration) {
      onEnd();
    }
  }, [elapsed, maxDuration, onEnd]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = maxDuration ? (elapsed / maxDuration) * 100 : 0;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b shadow-sm"
      role="status"
      aria-live="polite"
      aria-label="Session progress"
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Session info */}
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground">Live Session</span>
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">•</span>
            <span className="text-sm text-muted-foreground hidden sm:inline">{scenarioTitle}</span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-sm font-mono font-medium text-foreground tabular-nums">
              {formatTime(elapsed)}
              {maxDuration && (
                <span className="text-muted-foreground">
                  {' / '}
                  {formatTime(maxDuration)}
                </span>
              )}
            </span>
          </div>

          {/* End button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onEnd}
            className="gap-2"
            aria-label="End session"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">End</span>
          </Button>
        </div>

        {/* Progress bar */}
        {maxDuration && (
          <div className="mt-2">
            <Progress
              value={progress}
              className="h-1"
              aria-label={`Session progress: ${Math.round(progress)}%`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
