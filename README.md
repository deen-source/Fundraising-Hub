# Fundraising Hub

A comprehensive startup fundraising platform with AI-powered tools for founders.

## Features

### Core Features
- **Investor CRM**: Kanban-based pipeline management for investor relationships
- **Data Room**: Secure document sharing with investors
- **Practice Pitching**: AI-powered pitch practice with voice interaction
- **Forum**: Community discussion board for founders

### Financial Tools
- **Pitch Deck Analyzer**: AI-powered analysis of your pitch deck
- **Term Sheet Checker**: Get AI insights on term sheets
- **SAFE Calculator**: Calculate SAFE conversion scenarios
- **Cap Table**: Track equity ownership
- **Valuation Calculator**: Various valuation methodologies
- **Dilution Calculator**: Model fundraising rounds
- **Metric Benchmarks**: Industry standard metrics
- **Document Templates**: Pre-built legal and business templates

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: OpenAI API (gpt-4o-mini)
- **Voice**: ElevenLabs Voice Agents
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- ElevenLabs API key (optional, for voice features)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/deen-source/Fundraising-Hub.git
cd Fundraising-Hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Install Supabase CLI

```bash
npm install -g supabase
```

#### Link to Your Supabase Project

```bash
supabase link --project-ref <your-project-id>
```

#### Run Database Migrations

```bash
supabase db push
```

Or manually run migrations in order from `supabase/migrations/` directory via Supabase Dashboard.

#### Deploy Edge Functions

```bash
supabase functions deploy analyze-pitch-deck
supabase functions deploy analyze-term-sheet
supabase functions deploy practice-pitching
```

#### Set Edge Function Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# ElevenLabs (Optional)
VITE_ELEVENLABS_AGENT_NETWORKING=agent-id
VITE_ELEVENLABS_AGENT_COFFEE=agent-id
VITE_ELEVENLABS_AGENT_DEMO=agent-id
VITE_ELEVENLABS_AGENT_DEEPDIVE=agent-id
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### 6. Deploy to Vercel

#### Connect GitHub Repository

1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Set Environment Variables in Vercel

Add all environment variables from your `.env` file in Vercel Dashboard → Settings → Environment Variables

#### Deploy

Click "Deploy" and your app will be live!

## Project Structure

```
Fundraising-Hub/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── integrations/    # Supabase client & types
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Utility functions
├── supabase/
│   ├── functions/       # Edge functions (AI services)
│   └── migrations/      # Database migrations
├── public/              # Static assets
└── [config files]
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Lint code

## Database Schema

The application uses 14 tables:

- **profiles**: User profiles
- **investors**: Investor database with CRM data
- **investor_interactions**: Contact history
- **email_templates**: Reusable templates
- **email_campaigns**: Bulk outreach tracking
- **data_room_documents**: File metadata
- **data_room_shares**: Shareable links
- **forum_topics**: Discussion topics
- **forum_posts**: Topic replies
- **forum_votes**: Upvote/downvote system
- **document_templates**: Pre-built templates
- **saved_calculations**: Saved tool results
- **term_sheet_analyses**: AI analysis history
- **investor_data_imports**: Import tracking

## Edge Functions

Three Deno-based edge functions power AI features:

1. **analyze-pitch-deck**: Analyzes pitch deck content
2. **analyze-term-sheet**: Provides term sheet insights
3. **practice-pitching**: Handles pitch practice scenarios and feedback

## Support

For issues or questions, please open an issue on GitHub.

## License

MIT
