// Analytics utility for Arconic VC Simulator
import { AnalyticsEvent, ANALYTICS_EVENTS } from '@/types/arconic-simulator';

class ArconicAnalytics {
  private enabled: boolean = true;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    // In production, initialize your analytics SDK here
    // e.g., analytics.init(process.env.VITE_ANALYTICS_KEY)
  }

  private log(event: AnalyticsEvent): void {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      sessionId: this.getSessionId(),
    };

    // Console log for development
    if (import.meta.env.DEV) {
      console.log('[Arconic Analytics]', enrichedEvent);
    }

    // Add to queue
    this.queue.push(enrichedEvent);

    // In production, send to your analytics service
    // e.g., analytics.track(enrichedEvent.event, enrichedEvent.properties)
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('arconic_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('arconic_session_id', sessionId);
    }
    return sessionId;
  }

  // Scenario events
  scenarioSelected(scenarioId: string, scenarioTitle: string): void {
    this.log({
      event: ANALYTICS_EVENTS.SCENARIO_SELECTED,
      properties: { scenarioId, scenarioTitle },
    });
  }

  // Avatar events
  avatarSelected(avatarId: string, avatarName: string): void {
    this.log({
      event: ANALYTICS_EVENTS.AVATAR_SELECTED,
      properties: { avatarId, avatarName },
    });
  }

  // Microphone events
  micPermissionGranted(): void {
    this.log({
      event: ANALYTICS_EVENTS.MIC_PERMISSION_GRANTED,
    });
  }

  micPermissionDenied(error?: string): void {
    this.log({
      event: ANALYTICS_EVENTS.MIC_PERMISSION_DENIED,
      properties: { error },
    });
  }

  // Session events
  sessionStarted(scenarioId: string, avatarId: string): void {
    this.log({
      event: ANALYTICS_EVENTS.SESSION_STARTED,
      properties: { scenarioId, avatarId, startTime: Date.now() },
    });
  }

  sessionEnded(scenarioId: string, duration: number, completionRate: number): void {
    this.log({
      event: ANALYTICS_EVENTS.SESSION_ENDED,
      properties: { scenarioId, duration, completionRate },
    });
  }

  // Feedback events
  feedbackViewed(scenarioId: string, decision: string, score?: number): void {
    this.log({
      event: ANALYTICS_EVENTS.FEEDBACK_VIEWED,
      properties: { scenarioId, decision, score },
    });
  }

  // Action events
  rerunClicked(scenarioId: string): void {
    this.log({
      event: ANALYTICS_EVENTS.RERUN_CLICKED,
      properties: { scenarioId },
    });
  }

  switchScenarioClicked(fromScenarioId: string): void {
    this.log({
      event: ANALYTICS_EVENTS.SWITCH_SCENARIO_CLICKED,
      properties: { fromScenarioId },
    });
  }

  // Get analytics queue (useful for debugging)
  getQueue(): AnalyticsEvent[] {
    return [...this.queue];
  }

  // Clear queue
  clearQueue(): void {
    this.queue = [];
  }
}

// Export singleton instance
export const analytics = new ArconicAnalytics();
