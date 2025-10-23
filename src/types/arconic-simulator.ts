// TypeScript types for Arconic Capital VC Simulator

export interface Scenario {
  id: string;
  title: string;
  duration: string;
  description: string;
  imageSrc: string;
  bullets: string[];
  ctaText: string;
  agentId?: string;
  avatarId?: string;
  goal?: string;
}

export interface Avatar {
  id: string;
  name: string;
  role: string;
  imageSrc: string;
  voiceId?: string;
}

export interface FeedbackItem {
  category: string;
  score: number; // 1-5
  comment: string;
  highlight?: string;
}

export interface SessionFeedback {
  landed: string[];
  gaps: string[];
  decision: 'pass' | 'next-meeting' | 'term-sheet' | 'pending';
  overall: string;
  items: FeedbackItem[];
  duration: number;
}

export interface StatsItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export type AppState =
  | 'hero'
  | 'scenarios'
  | 'intro'
  | 'session'
  | 'analyzing'
  | 'feedback';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

// Analytics event names
export const ANALYTICS_EVENTS = {
  SCENARIO_SELECTED: 'scenario_selected',
  AVATAR_SELECTED: 'avatar_selected',
  MIC_PERMISSION_GRANTED: 'mic_permission_granted',
  MIC_PERMISSION_DENIED: 'mic_permission_denied',
  SESSION_STARTED: 'session_started',
  SESSION_ENDED: 'session_ended',
  FEEDBACK_VIEWED: 'feedback_viewed',
  RERUN_CLICKED: 'rerun_clicked',
  SWITCH_SCENARIO_CLICKED: 'switch_scenario_clicked',
} as const;
