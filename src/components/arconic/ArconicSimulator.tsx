import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, Scenario, SessionFeedback } from '@/types/arconic-simulator';
import { SCENARIOS, AVATARS } from '@/data/arconic-data';
import { analytics } from '@/lib/arconic-analytics';
import { generateSessionFeedbackWithDelay } from '@/lib/feedback-service';
import { canStartSession, recordSessionStart, getTodaySessionCount } from '@/lib/practice-session-service';
import { supabase } from '@/integrations/supabase/client';
import { Hero } from './Hero';
import { ScenariosGrid } from './ScenariosGrid';
import { SceneIntro } from './SceneIntro';
import { ElevenLabsVoiceWidget, ElevenLabsVoiceWidgetRef, ConversationMessage } from './ElevenLabsVoiceWidget';
import { SessionBar } from './SessionBar';
import { ActiveSessionView } from './ActiveSessionView';
import { AnalyzingLoader } from './AnalyzingLoader';
import { FeedbackPanel } from './FeedbackPanel';
import { SessionLimitBanner } from './SessionLimitBanner';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic } from 'lucide-react';

export const ArconicSimulator = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<AppState>('hero');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  // Voice session state
  const [transcript, setTranscript] = useState<ConversationMessage[]>([]);
  const [voiceStatus, setVoiceStatus] = useState({ isConnected: false, isSpeaking: false, isMuted: false });
  const [elapsed, setElapsed] = useState(0);
  const voiceWidgetRef = useRef<ElevenLabsVoiceWidgetRef>(null);

  // Feedback state
  const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);

  // Session limit state
  const [sessionsUsedToday, setSessionsUsedToday] = useState<number>(0);
  const [isLoadingLimits, setIsLoadingLimits] = useState(true);

  // Load session count on mount
  useEffect(() => {
    const loadSessionCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const count = await getTodaySessionCount(user.id);
        setSessionsUsedToday(count);
      }
      setIsLoadingLimits(false);
    };

    loadSessionCount();
  }, []);

  // Refresh session count function
  const refreshSessionCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const count = await getTodaySessionCount(user.id);
      setSessionsUsedToday(count);
    }
  };

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Start timer when first message arrives (conversation actually begins)
  useEffect(() => {
    if (isSessionActive && transcript.length > 0 && sessionStartTime === 0) {
      setSessionStartTime(Date.now());
    }
  }, [isSessionActive, transcript, sessionStartTime]);

  // Session elapsed timer
  useEffect(() => {
    if (!isSessionActive || sessionStartTime === 0) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'm':
          // Mute/unmute
          if (isSessionActive && voiceWidgetRef.current) {
            e.preventDefault();
            voiceWidgetRef.current.toggleMute();
          }
          break;
        case 'escape':
          // End session (with confirmation if active)
          if (isSessionActive) {
            e.preventDefault();
            const confirmed = window.confirm('Are you sure you want to end this session?');
            if (confirmed) {
              handleSessionEnd();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSessionActive]);

  // Get selected scenario
  const selectedScenario = selectedScenarioId
    ? SCENARIOS.find(s => s.id === selectedScenarioId)
    : null;

  // Handle scenario selection
  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    setIsIntroOpen(true);
    setAppState('intro');

    // Analytics
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      analytics.scenarioSelected(scenarioId, scenario.title);
    }

    // Announce to screen readers
    announceToScreenReader(`Selected ${scenario?.title} scenario. Opening introduction panel.`);
  };

  // Handle session start
  const handleSessionStart = async () => {
    if (!selectedScenarioId || !selectedScenario) return;

    // Check session limit before starting
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[Arconic] No user found');
      return;
    }

    const limitCheck = await canStartSession(user.id);
    if (!limitCheck.allowed) {
      console.warn('[Arconic] Daily session limit reached');
      setIsIntroOpen(false);
      announceToScreenReader('Daily session limit reached. Please try again tomorrow.');
      return;
    }

    // Record session start in database
    await recordSessionStart(user.id, selectedScenarioId);

    // Update local count
    setSessionsUsedToday(prev => prev + 1);

    setIsIntroOpen(false);
    setIsSessionActive(true);
    setSessionStartTime(0); // Don't start timer yet - wait for first message
    setElapsed(0);
    setTranscript([]);
    setAppState('session');

    // Analytics
    const avatarId = selectedScenario.avatarId || 'unknown';
    analytics.sessionStarted(selectedScenarioId, avatarId);

    // Announce to screen readers
    announceToScreenReader('Session started. You are now in a live practice session.');
  };

  // Handle session end - generate AI feedback
  const handleSessionEnd = async (transcriptFromWidget?: any[]) => {
    if (!selectedScenarioId) return;

    // Calculate duration only if session actually started (sessionStartTime !== 0)
    const duration = sessionStartTime > 0
      ? Math.floor((Date.now() - sessionStartTime) / 1000)
      : 0;
    setIsSessionActive(false);

    // Use transcript from state (which is updated in real-time)
    const currentTranscript = transcript.length > 0 ? transcript : transcriptFromWidget || [];

    // Log transcript for debugging
    if (currentTranscript.length > 0) {
      console.log('[Arconic] Conversation transcript:', currentTranscript);
    }

    // Analytics
    analytics.sessionEnded(selectedScenarioId, duration, 100);

    // Announce to screen readers
    announceToScreenReader('Session complete. Analysing your pitch...');

    // Show analyzing loader
    setAppState('analyzing');

    try {
      // Generate AI feedback with minimum 2-second delay for UX
      const feedback = await generateSessionFeedbackWithDelay({
        transcript: currentTranscript,
        scenarioId: selectedScenarioId,
        duration,
      }, 2000);

      setSessionFeedback(feedback);
      setAppState('feedback');

      // Analytics
      analytics.feedbackViewed();

    } catch (error) {
      console.error('[Arconic] Error generating feedback:', error);
      announceToScreenReader('Unable to generate feedback. Please try again.');

      // Fallback: return to scenarios
      setSelectedScenarioId(null);
      setAppState('scenarios');
      setTimeout(() => {
        document.getElementById('scenarios-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Close intro panel
  const handleCloseIntro = () => {
    setIsIntroOpen(false);
    setAppState('scenarios');
  };

  // Handle mute toggle
  const handleToggleMute = () => {
    if (voiceWidgetRef.current) {
      voiceWidgetRef.current.toggleMute();
    }
  };

  // Handle feedback panel actions
  const handleFeedbackRerun = () => {
    if (!selectedScenarioId) return;

    // Analytics
    analytics.rerunClicked();

    // Reset state and restart the same scenario
    setSessionFeedback(null);
    setIsIntroOpen(true);
    setAppState('intro');
  };

  const handleFeedbackSwitchScenario = () => {
    // Analytics
    analytics.switchScenarioClicked();

    // Reset state and return to scenarios
    setSelectedScenarioId(null);
    setSessionFeedback(null);
    setAppState('scenarios');

    // Scroll to scenarios
    setTimeout(() => {
      document.getElementById('scenarios-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleCloseFeedback = () => {
    handleFeedbackSwitchScenario();
  };

  // Screen reader announcement helper
  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Note: maxDuration removed - ElevenLabs agent controls session end naturally

  return (
    <div className="min-h-screen bg-background">
      {/* Active Session View */}
      {isSessionActive && selectedScenario && (
        <>
          {/* Back Button for Active Session - Fixed top left */}
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            size="sm"
            className="fixed top-4 left-4 z-50 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          <ActiveSessionView
            scenario={selectedScenario}
            avatar={AVATARS.find(a => a.id === selectedScenario.avatarId) || AVATARS[0]}
            isConnected={voiceStatus.isConnected}
            isSpeaking={voiceStatus.isSpeaking}
            isMuted={voiceStatus.isMuted}
            transcript={transcript}
            elapsed={elapsed}
            onToggleMute={handleToggleMute}
            onEndSession={() => handleSessionEnd()}
          />
        </>
      )}

      {/* Home View - hidden during active session with fade transition */}
      <div className={isSessionActive ? 'hidden' : 'animate-in fade-in duration-400'}>
        {/* Main content */}
        <div className="container mx-auto px-4 py-8">
          {/* Back Button - Same position as other pages */}
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {/* Hero section */}
          <div className="mb-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border">
              <Mic className="w-4 h-4 text-foreground" />
              <span className="text-sm font-medium text-foreground">Pitch Practice</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Master Your Pitch. Raise with Confidence.
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select a scenario. Test your pitch. Get instant feedback.
            </p>
          </div>

          {/* Session Limit Banner */}
          {!isLoadingLimits && (
            <SessionLimitBanner
              sessionsUsed={sessionsUsedToday}
              onRefresh={refreshSessionCount}
            />
          )}

          {/* Scenarios section - only show if under limit */}
          {sessionsUsedToday < 4 ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Choose Your Scenario</h2>
              </div>

              <ScenariosGrid
                scenarios={SCENARIOS}
                selectedId={selectedScenarioId}
                onSelect={handleScenarioSelect}
              />
            </div>
          ) : null}

          {/* Confidence statistic */}
          <div className="mt-8 py-6 px-6 border rounded-lg text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Confidence is practiced.
            </h3>
            <p className="text-base text-muted-foreground">
              95% of speakers conquer nerves by rehearsing first. Start your next raise with certainty.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="mt-8 py-4 px-6 text-center border-t">
            <p className="text-xs text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              This is an AI-powered simulation for practice and educational purposes only. This is not financial, legal, or investment advice and does not consider your personal circumstances. Your voice conversations are processed securely by ElevenLabs. Always seek advice from a licensed professional for actual fundraising decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Scene intro (drawer/sheet) */}
      {selectedScenario && selectedScenario.avatarId && (
        <SceneIntro
          scenario={selectedScenario}
          avatar={AVATARS.find(a => a.id === selectedScenario.avatarId) || AVATARS[0]}
          isOpen={isIntroOpen}
          isMobile={isMobile}
          onStart={handleSessionStart}
          onClose={handleCloseIntro}
        />
      )}

      {/* ElevenLabs Voice widget (during session) - hidden, using custom UI */}
      {isSessionActive && selectedScenario && (
        <ElevenLabsVoiceWidget
          ref={voiceWidgetRef}
          agentId={selectedScenario.agentId || ''}
          autoStart
          hideWidget={true}
          onStart={() => {
            console.log('[Arconic] ElevenLabs session started');
          }}
          onEnd={(transcript) => {
            handleSessionEnd(transcript);
          }}
          onError={(error) => {
            console.error('[Arconic] Voice error:', error);
            // Optionally show error to user
            announceToScreenReader(`Voice error: ${error}`);
          }}
          onPermission={(granted) => {
            if (granted) {
              analytics.micPermissionGranted();
            } else {
              analytics.micPermissionDenied();
            }
          }}
          onTranscriptUpdate={(updatedTranscript) => {
            setTranscript(updatedTranscript);
          }}
          onStatusChange={(status) => {
            setVoiceStatus(status);
          }}
        />
      )}

      {/* Analyzing Loader */}
      {appState === 'analyzing' && (
        <AnalyzingLoader scenarioTitle={selectedScenario?.title} />
      )}

      {/* Feedback Panel */}
      {appState === 'feedback' && sessionFeedback && selectedScenario && (
        <FeedbackPanel
          feedback={sessionFeedback}
          scenarioTitle={selectedScenario.title}
          isOpen={true}
          isMobile={isMobile}
          onRerun={handleFeedbackRerun}
          onSwitch={handleFeedbackSwitchScenario}
          onClose={handleCloseFeedback}
        />
      )}

    </div>
  );
};
