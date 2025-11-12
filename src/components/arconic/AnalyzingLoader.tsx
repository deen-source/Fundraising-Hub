import { useEffect, useState } from 'react';
import { Loader2, Sparkles, TrendingUp, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyzingLoaderProps {
  scenarioTitle?: string;
}

const motivationalMessages = [
  "Analysing your pitch...",
  "Evaluating key points...",
  "Assessing clarity and impact...",
  "Reviewing traction signals...",
  "Generating personalised feedback...",
];

export const AnalyzingLoader = ({ scenarioTitle }: AnalyzingLoaderProps) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Rotate through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % motivationalMessages.length);
    }, 1200);

    return () => clearInterval(messageInterval);
  }, []);

  // Animate progress bar
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Cap at 95% until real completion
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md w-full px-6 py-8 space-y-6">
        {/* Icon animation */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Spinning loader */}
            <Loader2 className="w-16 h-16 text-foreground animate-spin" />

            {/* Pulsing sparkles */}
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-foreground animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -left-2">
              <Target className="w-5 h-5 text-muted-foreground animate-pulse delay-75" />
            </div>
          </div>
        </div>

        {/* Title */}
        {scenarioTitle && (
          <h2 className="text-2xl font-bold text-center text-foreground">
            {scenarioTitle}
          </h2>
        )}

        {/* Rotating message */}
        <div className="text-center h-8">
          <p
            key={messageIndex}
            className={cn(
              "text-lg text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
            )}
          >
            {motivationalMessages[messageIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            This should only take a few seconds
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
            <TrendingUp className="w-5 h-5 text-foreground" />
            <span className="text-xs text-center text-muted-foreground">
              Strengths
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Target className="w-5 h-5 text-foreground" />
            <span className="text-xs text-center text-muted-foreground">
              Areas to Improve
            </span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/30">
            <Sparkles className="w-5 h-5 text-foreground" />
            <span className="text-xs text-center text-muted-foreground">
              Next Steps
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
