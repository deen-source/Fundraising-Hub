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
  NETWORKING: import.meta.env.VITE_ELEVENLABS_AGENT_NETWORKING || 'agent_1701k7670etze94ambhpxxyynw87',
  FIRST_COFFEE: import.meta.env.VITE_ELEVENLABS_AGENT_COFFEE || 'agent_6201k767k2s5fgkrx9p97r4pz703',
  DEMO_DAY: import.meta.env.VITE_ELEVENLABS_AGENT_DEMO || 'agent_7801k763rfw7f7at4n1qgy7v0wve',
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
    id: 'networking',
    title: 'Networking',
    duration: '2 min',
    description: 'A quick encounter in a hallway or at an event. Make your venture unforgettable — in under two minutes.',
    imageSrc: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=288&h=288&fit=crop',
    goal: 'Deliver a sharp one-liner: what you do, who it\'s for, proof, and why now.',
    bullets: [
      'Perfect your elevator pitch in under 2 minutes',
      'Practice value proposition clarity',
      'Handle follow-up questions confidently',
      'Leave a memorable impression',
    ],
    agentId: AGENT_IDS.NETWORKING,
    avatarId: 'charlie',
  },
  {
    id: 'first-coffee',
    title: 'First Coffee',
    duration: '5 min',
    description: 'An informal chat to test mutual interest before the formal pitch. Build rapport, not slides.',
    imageSrc: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=288&h=288&fit=crop',
    goal: 'Explain what you\'re building, why you\'re the right founder, market dynamics, and early traction.',
    bullets: [
      'Build rapport in a casual setting',
      'Communicate your vision authentically',
      'Address team composition questions',
      'Discuss initial market traction',
    ],
    agentId: AGENT_IDS.FIRST_COFFEE,
    avatarId: 'eric',
  },
  {
    id: 'demo-day',
    title: 'Online Pitch — Demo Day',
    duration: '5 min',
    description: 'Deliver a tight, high-energy pitch followed by rapid-fire Q&A. Capture attention, hold the room.',
    imageSrc: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=288&h=288&fit=crop',
    goal: 'Deliver a 2-minute pitch covering problem, solution, market size, team strength, and proof—then handle Q&A.',
    bullets: [
      'Deliver structured 2-minute pitch',
      'Handle rapid-fire questions',
      'Showcase team credentials',
      'Present market opportunity',
    ],
    agentId: AGENT_IDS.DEMO_DAY,
    avatarId: 'alice',
  },
  {
    id: 'deep-dive',
    title: 'Deep Dive',
    duration: '10 min',
    description: 'A full partner session where investors stress-test your model, metrics, and market assumptions. Show your depth under pressure.',
    imageSrc: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=288&h=288&fit=crop',
    goal: 'Share updates since last meeting: traction, learnings, market evolution, and where you need input.',
    bullets: [
      'Deep dive into business model',
      'Defend unit economics assumptions',
      'Address risk mitigation strategies',
      'Demonstrate operational understanding',
    ],
    agentId: AGENT_IDS.DEEP_DIVE,
    avatarId: 'george',
  },
];

// Mock feedback generator
export const generateMockFeedback = (scenarioId: string, duration: number): SessionFeedback => {
  const scenario = SCENARIOS.find(s => s.id === scenarioId);

  // Different feedback based on scenario
  const feedbackMap: Record<string, Partial<SessionFeedback>> = {
    networking: {
      landed: [
        'Crystal-clear problem statement',
        'Compelling market timing',
        'Strong personal credibility',
      ],
      gaps: [
        'Competitive differentiation could be sharper',
        'Consider adding a specific traction metric',
      ],
      decision: 'next-meeting',
      overall: 'Your elevator pitch showed strong clarity and passion. The problem-solution fit is evident. To strengthen further, consider weaving in a concrete traction number and sharpening how you\'re uniquely positioned vs competitors.',
      items: [
        {
          category: 'Clarity',
          score: 4,
          comment: 'Problem and solution were articulated clearly.',
          highlight: '"We help SMBs automate their bookkeeping in under 5 minutes."',
        },
        {
          category: 'Timing',
          score: 5,
          comment: 'Market timing argument was compelling and well-researched.',
        },
        {
          category: 'Differentiation',
          score: 3,
          comment: 'Could strengthen unique positioning vs existing solutions.',
        },
        {
          category: 'Credibility',
          score: 4,
          comment: 'Strong founder background came through authentically.',
        },
      ],
    },
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
    'demo-day': {
      landed: [
        'Structured pitch with clear flow',
        'Strong visual storytelling',
        'Impressive team credentials',
        'Large addressable market',
      ],
      gaps: [
        'Revenue model needs more detail',
        'Customer acquisition strategy unclear',
      ],
      decision: 'next-meeting',
      overall: 'Excellent structure and delivery. Your team slide was particularly strong. To move forward, we\'d want to dig deeper into how you\'re planning to monetize and scale customer acquisition.',
      items: [
        {
          category: 'Pitch Structure',
          score: 5,
          comment: 'Well-organised, hit all key points in time.',
        },
        {
          category: 'Team Credentials',
          score: 5,
          comment: 'Impressive backgrounds directly relevant to problem.',
        },
        {
          category: 'Market Opportunity',
          score: 4,
          comment: 'Large TAM well-supported with data.',
        },
        {
          category: 'Business Model',
          score: 3,
          comment: 'Revenue model needs more specificity.',
        },
        {
          category: 'Q&A Handling',
          score: 4,
          comment: 'Responded confidently to questions.',
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

  const baseTemplate = feedbackMap[scenarioId] || feedbackMap.networking;

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
