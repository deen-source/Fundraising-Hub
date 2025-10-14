import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceWidgetProps {
  agentId?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
  onPermission?: (granted: boolean) => void;
  autoStart?: boolean;
}

export const VoiceWidget = ({
  agentId,
  onStart,
  onEnd,
  onError,
  onPermission,
  autoStart = false,
}: VoiceWidgetProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start session
  const startSession = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      onPermission?.(true);

      // Set up audio analysis for visualizations
      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      analyzerRef.current.fftSize = 256;

      // Set up media recorder (for actual voice capture if needed)
      mediaRecorderRef.current = new MediaRecorder(stream);

      setIsActive(true);
      setError(null);
      onStart?.();

      // Start mock conversation flow
      simulateConversation();
      visualizeAudio();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Microphone access denied';
      setError(errorMsg);
      onError?.(errorMsg);
      onPermission?.(false);
    }
  };

  // Simulate conversation flow (mock for demonstration)
  const simulateConversation = () => {
    // AI speaks first
    setTimeout(() => {
      setIsSpeaking(true);
      setTimeout(() => {
        setIsSpeaking(false);
        setIsListening(true);
      }, 3000);
    }, 500);

    // User listens then responds
    setTimeout(() => {
      setIsListening(true);
    }, 3500);

    // Continue alternating
    const conversationInterval = setInterval(() => {
      setIsListening(prev => !prev);
      setIsSpeaking(prev => !prev);
    }, 8000);

    // Clean up on unmount
    return () => clearInterval(conversationInterval);
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyzerRef.current) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!analyzerRef.current) return;

      analyzerRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 100));

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  // Stop session
  const stopSession = () => {
    // Stop all tracks
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    setAudioLevel(0);
    onEnd?.();
  };

  // Toggle mute
  const toggleMute = () => {
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart) {
      startSession();
    }

    return () => {
      if (isActive) {
        stopSession();
      }
    };
  }, [autoStart]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-background border-2 border-primary shadow-2xl rounded-full px-6 py-4 flex items-center gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isListening && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Mic className="w-5 h-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-foreground">Listening...</span>
            </div>
          )}
          {isSpeaking && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Volume2 className="w-5 h-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-medium text-foreground">Speaking...</span>
            </div>
          )}
        </div>

        {/* Audio visualizer */}
        <div className="flex gap-1 h-8 items-center">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1 rounded-full bg-primary transition-all duration-150',
                isListening ? 'opacity-100' : 'opacity-30'
              )}
              style={{
                height: `${Math.max(8, (audioLevel * Math.random() * 0.8))}px`,
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-8 w-8"
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={stopSession}
            className="h-8"
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
    </div>
  );
};
