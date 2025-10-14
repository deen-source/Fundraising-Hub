import { useState, useEffect } from 'react';
import { AppState, Scenario } from '@/types/arconic-simulator';
import { SCENARIOS, AVATARS } from '@/data/arconic-data';
import { analytics } from '@/lib/arconic-analytics';
import { Hero } from './Hero';
import { ScenariosGrid } from './ScenariosGrid';
import { SceneIntro } from './SceneIntro';
import { ElevenLabsVoiceWidget } from './ElevenLabsVoiceWidget';
import { SessionBar } from './SessionBar';

export const ArconicSimulator = () => {
  const [appState, setAppState] = useState<AppState>('hero');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const handleSessionStart = () => {
    if (!selectedScenarioId || !selectedScenario) return;

    setIsIntroOpen(false);
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setAppState('session');

    // Analytics
    const avatarId = selectedScenario.avatarId || 'unknown';
    analytics.sessionStarted(selectedScenarioId, avatarId);

    // Announce to screen readers
    announceToScreenReader('Session started. You are now in a live practice session.');
  };

  // Handle session end (with optional transcript from ElevenLabs)
  const handleSessionEnd = (transcript?: any[]) => {
    if (!selectedScenarioId) return;

    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
    setIsSessionActive(false);
    setSelectedScenarioId(null);
    setAppState('scenarios');

    // Analytics
    analytics.sessionEnded(selectedScenarioId, duration, 100);

    // Log transcript if available
    if (transcript && transcript.length > 0) {
      console.log('[Arconic] Conversation transcript:', transcript);
    }

    // Announce to screen readers
    announceToScreenReader('Session complete. Thank you for practicing.');

    // Scroll back to scenarios
    setTimeout(() => {
      document.getElementById('scenarios-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Close intro panel
  const handleCloseIntro = () => {
    setIsIntroOpen(false);
    setAppState('scenarios');
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

  // Parse duration for max session time
  const getMaxDuration = (scenario: Scenario): number | undefined => {
    // Parse duration like "5 min" or "60–180s"
    const match = scenario.duration.match(/(\d+)\s*min/);
    if (match) {
      return parseInt(match[1]) * 60; // Convert to seconds
    }
    const secondsMatch = scenario.duration.match(/(\d+)s/);
    if (secondsMatch) {
      return parseInt(secondsMatch[1]);
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Session bar (only visible during active session) */}
      {isSessionActive && selectedScenario && (
        <SessionBar
          maxDuration={getMaxDuration(selectedScenario)}
          onEnd={handleSessionEnd}
          scenarioTitle={selectedScenario.title}
        />
      )}

      {/* Main content */}
      <main className={`container mx-auto px-4 ${isSessionActive ? 'pt-24' : 'py-12'}`}>
        {/* Hero section */}
        <Hero
          title="Rehearse Your Pitch. Raise with Confidence."
          subhead="Turn every investor conversation into an opportunity."
        />

        {/* Scenarios grid */}
        <section id="scenarios-section" className="mb-12 -mx-4 px-4 py-12 bg-gray-50/50">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Choose Your Scenario
            </h2>
            <p className="text-muted-foreground">
              Practice real-world VC scenarios with your personal AI partner.
            </p>
          </div>

          <ScenariosGrid
            scenarios={SCENARIOS}
            selectedId={selectedScenarioId}
            onSelect={handleScenarioSelect}
          />
        </section>

        {/* Confidence statistic */}
        <div className="my-12 py-6 px-6 bg-primary/5 border-2 border-primary/20 rounded-lg text-center">
          <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
            Confidence comes from practice.
          </h3>
          <p className="text-base md:text-lg text-muted-foreground">
            95% of speakers conquer nerves by rehearsing first. Start your next raise with certainty.
          </p>
        </div>
      </main>

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

      {/* ElevenLabs Voice widget (during session) */}
      {isSessionActive && selectedScenario && (
        <ElevenLabsVoiceWidget
          agentId={selectedScenario.agentId || ''}
          autoStart
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
        />
      )}

    </div>
  );
};
