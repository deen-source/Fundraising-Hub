import { Scenario, Avatar, SessionFeedback } from '@/types/arconic-simulator';
import { Users, TrendingUp, Presentation, Target } from 'lucide-react';

// ============================
// IMPORTANT: ADD YOUR ELEVENLABS AGENT IDs HERE
// ============================
// 1. Go to https://elevenlabs.io/app/conversational-ai
// 2. Find your 4 agents and copy their Agent IDs
// 3. Replace the placeholder values below with your real agent IDs
// 4. (Optional) Move these to environment variables for security

const AGENT_IDS = {
  FIRST_COFFEE: import.meta.env.VITE_ELEVENLABS_AGENT_COFFEE || 'agent_6201k767k2s5fgkrx9p97r4pz703',
  DEEP_DIVE: import.meta.env.VITE_ELEVENLABS_AGENT_DEEPDIVE || 'agent_1301k76ae0hwfryvq8epjeabxhg0',
};

// Mock avatar images - in production, replace with actual avatar images
const AVATAR_BASE = '/avatars'; // Update this path based on your asset structure

export const AVATARS: Avatar[] = [
  {
    id: 'charlie',
    name: 'Charlie',
    role: 'Partner',
    imageSrc: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240&h=240&fit=crop',
    voiceId: 'charlie-voice',
  },
  {
    id: 'eric',
    name: 'Eric',
    role: 'Partner',
    imageSrc: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240&h=240&fit=crop',
    voiceId: 'eric-voice',
  },
  {
    id: 'alice',
    name: 'Alice',
    role: 'Principal',
    imageSrc: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&h=240&fit=crop',
    voiceId: 'alice-voice',
  },
  {
    id: 'george',
    name: 'George',
    role: 'Partner',
    imageSrc: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=240&h=240&fit=crop',
    voiceId: 'george-voice',
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'first-coffee',
    title: 'First Coffee',
    duration: '2 min',
    description: 'An informal chat to test mutual interest. Build rapport, not slides.',
    imageSrc: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=288&h=288&fit=crop',
    scenarioContext: 'Imagine we\'re sitting down for our first coffee. The goal isn\'t to land an investment on the spot – think of it as a chance to spark interest and open the door to a deeper conversation.',
    goal: 'Explain what you\'re building, why you\'re the right founder, how the market looks and the early traction you\'ve seen.',
    bullets: [
      'A casual conversation about what you\'re building',
      'Discussion about your team',
      'Eric will probe your market understanding and early traction',
    ],
    ctaText: 'Start Coffee Chat',
    agentId: AGENT_IDS.FIRST_COFFEE,
    avatarId: 'eric',
  },
  {
    id: 'deep-dive',
    title: 'Deep Dive',
    duration: '5 min',
    description: 'A deep dive on your model, metrics and assumptions. Show clarity under pressure.',
    imageSrc: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=288&h=288&fit=crop',
    scenarioContext: 'Imagine this is a focused deep dive follow up after you\'ve had a few initial conversation with a venture fund.',
    goal: 'Bring the VC up to speed on what\'s changed, what you\'ve learned and the key proof points since you last spoke.',
    bullets: [
      'Questions about your business model',
      'Discussion about competitive risks and mitigation plans',
      'George will stress-test your operational assumptions',
    ],
    ctaText: 'Start Deep Dive',
    agentId: AGENT_IDS.DEEP_DIVE,
    avatarId: 'george',
  },
];

// Mock feedback generator
export const generateMockFeedback = (scenarioId: string, duration: number): SessionFeedback => {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);

  // Different feedback based on scenario
  const feedbackMap: Record<string, Partial<SessionFeedback>> = {
    'first-coffee': {
      landed: [
        'Authentic storytelling about founding journey',
        'Clear vision for the future',
        'Team chemistry and complementary skills',
      ],
      gaps: [
        'Early traction numbers need more context',
        'Go-to-market strategy could be more specific',
      ],
      decision: 'next-meeting',
      overall: 'Great chemistry and authentic passion for the problem. Your founding story resonated well. Next steps: bring more specificity around early signals and your distribution strategy.',
      items: [
        {
          category: 'Vision',
          score: 5,
          comment: 'Compelling long-term vision clearly articulated.',
        },
        {
          category: 'Team',
          score: 4,
          comment: 'Strong complementary skills, good chemistry.',
        },
        {
          category: 'Traction',
          score: 3,
          comment: 'Early signals present but need more context.',
        },
        {
          category: 'Market Understanding',
          score: 4,
          comment: 'Demonstrated deep market knowledge.',
        },
      ],
    },
    'deep-dive': {
      landed: [
        'Detailed unit economics breakdown',
        'Thoughtful risk assessment',
        'Clear path to profitability',
        'Strong competitive moat',
      ],
      gaps: [
        'Churn assumptions may be optimistic',
        'Customer concentration risk needs addressing',
      ],
      decision: 'term-sheet',
      overall: 'Impressive command of your business fundamentals. Unit economics look sound with realistic assumptions. We\'d want to understand churn dynamics better and discuss customer concentration, but overall very strong diligence-ready presentation.',
      items: [
        {
          category: 'Unit Economics',
          score: 5,
          comment: 'Comprehensive breakdown with realistic assumptions.',
          highlight: 'LTV/CAC of 4.2x with 18-month payback period',
        },
        {
          category: 'Risk Assessment',
          score: 4,
          comment: 'Identified key risks with mitigation plans.',
        },
        {
          category: 'Operational Understanding',
          score: 5,
          comment: 'Deep knowledge of operational metrics.',
        },
        {
          category: 'Financial Model',
          score: 4,
          comment: 'Solid model with room for stress-testing assumptions.',
        },
        {
          category: 'Competitive Positioning',
          score: 4,
          comment: 'Clear moat, defensibility well-articulated.',
        },
      ],
    },
  };

  const baseTemplate = feedbackMap[scenarioId] || feedbackMap['first-coffee'];

  return {
    landed: baseTemplate.landed || [],
    gaps: baseTemplate.gaps || [],
    decision: baseTemplate.decision || 'next-meeting',
    overall: baseTemplate.overall || 'Good session overall.',
    items: baseTemplate.items || [],
    duration,
  };
};

// Stats for optional display
export const STATS = {
  sessionsCompleted: '12.4K',
  avgScore: '4.2',
  fundingRaised: '$240M',
  avgImprovement: '+32%',
};
