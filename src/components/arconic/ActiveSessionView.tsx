import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Mic, MicOff, Volume2, MessageSquare, X, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar as AvatarType, Scenario } from '@/types/arconic-simulator';
import { ConversationMessage } from './ElevenLabsVoiceWidget';

interface ActiveSessionViewProps {
  scenario: Scenario;
  avatar: AvatarType;
  isConnected: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  transcript: ConversationMessage[];
  elapsed: number;
  onToggleMute: () => void;
  onEndSession: () => void;
}

export const ActiveSessionView = ({
  scenario,
  avatar,
  isConnected,
  isSpeaking,
  isMuted,
  transcript,
  elapsed,
  onToggleMute,
  onEndSession,
}: ActiveSessionViewProps) => {
  const [showTranscript, setShowTranscript] = useState(true);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get last few messages for display
  const recentMessages = transcript.slice(-4);

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    const transcriptElement = document.getElementById('transcript-content');
    if (transcriptElement) {
      transcriptElement.scrollTop = transcriptElement.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center justify-center px-4 py-8 transition-opacity duration-400 animate-in fade-in">
      {/* Main content container */}
      <div className="w-full max-w-2xl mx-auto space-y-8">

        {/* Scenario title */}
        <div className="text-center space-y-2">
          <h2 className="text-lg font-medium text-muted-foreground">
            {scenario.title}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-primary font-medium">Live Session</span>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={avatar.imageSrc}
              alt={avatar.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
            />
            {/* Status indicator on avatar */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border-2 border-primary/20 shadow-md transition-all duration-200">
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <>
                    <Volume2 className="w-3 h-3 text-primary animate-pulse" />
                    <span className="text-xs font-medium text-foreground">Speaking</span>
                  </>
                ) : isConnected ? (
                  <>
                    <Mic className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-foreground">Listening</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs font-medium text-muted-foreground">Processing...</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audio visualizer */}
        {isConnected && (
          <div className="flex justify-center">
            <div className="flex gap-1.5 h-12 items-center">
              {[...Array(16)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1 rounded-full bg-primary transition-all duration-150',
                    isSpeaking ? 'opacity-100' : 'opacity-40'
                  )}
                  style={{
                    height: `${Math.max(8, Math.sin((Date.now() / 100) + i) * 20 + 20)}px`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Timer */}
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-lg font-mono font-medium text-foreground tabular-nums">
            {formatTime(elapsed)}
          </span>
        </div>

        {/* Live transcript */}
        {showTranscript && transcript.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Live Transcript</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript(false)}
                className="h-6 px-2"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
            </div>

            <ScrollArea className="h-32" id="transcript-content">
              <div className="space-y-2 pr-4">
                {recentMessages.map((msg, idx) => (
                  <div key={idx} className="text-sm">
                    <span className={cn(
                      "font-medium",
                      msg.role === 'user' ? 'text-primary' : 'text-secondary-foreground'
                    )}>
                      {msg.role === 'user' ? 'You:' : `${avatar.name}:`}
                    </span>
                    <span className="ml-2 text-muted-foreground">{msg.content}</span>
                  </div>
                ))}
                {/* Typing indicator when AI is speaking */}
                {isSpeaking && (
                  <div className="text-sm flex items-center gap-2 animate-in fade-in duration-200">
                    <span className="font-medium text-secondary-foreground">{avatar.name}:</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Show transcript button when hidden */}
        {!showTranscript && transcript.length > 0 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranscript(true)}
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Show Transcript
            </Button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onToggleMute}
            className="gap-2 min-w-[120px]"
            disabled={!isConnected}
          >
            {isMuted ? (
              <>
                <MicOff className="w-4 h-4" />
                Unmute
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Mute
              </>
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={onEndSession}
            className="gap-2 min-w-[120px]"
          >
            <X className="w-4 h-4" />
            End Session
          </Button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Shortcuts: <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">M</kbd> Mute •
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">Esc</kbd> End
          </p>
        </div>

      </div>
    </div>
  );
};
