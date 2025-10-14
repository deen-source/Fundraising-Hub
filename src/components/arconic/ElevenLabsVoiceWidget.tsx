import { useEffect, useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ElevenLabsVoiceWidgetProps {
  agentId: string;
  onStart?: () => void;
  onEnd?: (transcript: ConversationMessage[]) => void;
  onError?: (error: string) => void;
  onPermission?: (granted: boolean) => void;
  autoStart?: boolean;
}

export const ElevenLabsVoiceWidget = ({
  agentId,
  onStart,
  onEnd,
  onError,
  onPermission,
  autoStart = false,
}: ElevenLabsVoiceWidgetProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<ConversationMessage[]>([]);

  // Initialize conversation with callbacks
  const conversation = useConversation({
    onConnect: () => {
      console.log('[ElevenLabs] Connected');
      setIsActive(true);
      setError(null);
      onStart?.();
    },

    onDisconnect: () => {
      console.log('[ElevenLabs] Disconnected');
      handleSessionEnd();
    },

    onMessage: (message) => {
      console.log('[ElevenLabs] Message:', message);

      // Capture transcript
      if (message.message) {
        const newMessage: ConversationMessage = {
          role: message.source === 'user' ? 'user' : 'assistant',
          content: message.message,
          timestamp: Date.now(),
        };

        setTranscript(prev => [...prev, newMessage]);
      }
    },

    onError: (err) => {
      console.error('[ElevenLabs] Error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Connection error occurred';
      setError(errorMsg);
      onError?.(errorMsg);
    },

    onModeChange: (mode) => {
      console.log('[ElevenLabs] Mode changed:', mode);
    },
  });

  // Start session
  const startSession = useCallback(async () => {
    if (!agentId) {
      const errorMsg = 'No agent ID provided';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      onPermission?.(true);

      // Start ElevenLabs conversation
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'webrtc', // or 'websocket'
      });

      console.log('[ElevenLabs] Session started with agent:', agentId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start session';
      setError(errorMsg);
      onError?.(errorMsg);
      onPermission?.(false);
    }
  }, [agentId, conversation, onError, onPermission]);

  // Stop session
  const stopSession = useCallback(async () => {
    try {
      await conversation.endSession();
      console.log('[ElevenLabs] Session ended');
    } catch (err) {
      console.error('[ElevenLabs] Error ending session:', err);
    }
  }, [conversation]);

  // Handle session end
  const handleSessionEnd = useCallback(() => {
    setIsActive(false);
    onEnd?.(transcript);
  }, [transcript, onEnd]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    conversation.setVolume(isMuted ? 1 : 0);
    setIsMuted(!isMuted);
  }, [conversation, isMuted]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && agentId) {
      startSession();
    }

    // Cleanup on unmount
    return () => {
      if (conversation.status === 'connected') {
        stopSession();
      }
    };
  }, [autoStart, agentId]);

  // Don't render if not active
  if (!isActive && conversation.status !== 'connecting') {
    return null;
  }

  const isConnecting = conversation.status === 'connecting';
  const isConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-background border-2 border-primary shadow-2xl rounded-full px-6 py-4 flex items-center gap-4">
        {/* Connection status */}
        {isConnecting && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
            <span className="text-sm font-medium text-foreground">Connecting...</span>
          </div>
        )}

        {/* Active conversation status */}
        {isConnected && (
          <div className="flex items-center gap-2">
            {isSpeaking ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Volume2 className="w-5 h-5 text-primary" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-medium text-foreground">AI Speaking...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Mic className="w-5 h-5 text-primary" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
                <span className="text-sm font-medium text-foreground">Listening...</span>
              </div>
            )}
          </div>
        )}

        {/* Audio visualizer (simplified) */}
        {isConnected && (
          <div className="flex gap-1 h-8 items-center">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 rounded-full bg-primary transition-all duration-150',
                  isSpeaking ? 'opacity-100' : 'opacity-30'
                )}
                style={{
                  height: `${Math.max(8, Math.random() * 24)}px`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            disabled={!isConnected}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={stopSession}
            className="h-8"
            disabled={isConnecting}
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mt-2 text-center">
          <p className="text-xs text-destructive bg-destructive/10 px-3 py-1 rounded-full">
            {error}
          </p>
        </div>
      )}

      {/* Transcript count (hidden but tracked) */}
      <span className="sr-only">
        {transcript.length} messages in conversation
      </span>
    </div>
  );
};
