-- Create storage bucket for data room documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'data-room',
  'data-room',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv', 'image/jpeg', 'image/png']
);

-- Create data_room_documents table
CREATE TABLE public.data_room_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  folder TEXT DEFAULT 'root',
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  shared_with_investors UUID[] DEFAULT ARRAY[]::UUID[],
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_room_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_room_documents
CREATE POLICY "Users can view own documents"
  ON public.data_room_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.data_room_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.data_room_documents
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.data_room_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_data_room_documents_updated_at
  BEFORE UPDATE ON public.data_room_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for data-room bucket
CREATE POLICY "Users can view own files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'data-room' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'data-room' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own files"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'data-room' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'data-room' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create document_templates table
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for templates (public read)
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view templates"
  ON public.document_templates
  FOR SELECT
  USING (true);

-- Insert default document templates
INSERT INTO public.document_templates (name, category, description, template_type, content) VALUES
('Non-Disclosure Agreement (NDA)', 'Legal', 'Standard mutual NDA for investor discussions', 'legal', 'MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of [DATE] by and between:

[COMPANY NAME], a [STATE] corporation ("Company")
and
[INVESTOR NAME] ("Recipient")

1. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means any information disclosed by either party that is marked as confidential or should reasonably be considered confidential given the nature of the information and circumstances of disclosure.

2. OBLIGATIONS
Each party agrees to:
- Maintain confidentiality of the other party''s Confidential Information
- Use Confidential Information only for the purpose of evaluating a potential investment
- Not disclose to third parties without prior written consent

3. TERM
This Agreement shall remain in effect for two (2) years from the date of execution.

[COMPANY NAME]                    [INVESTOR NAME]
By: ____________________         By: ____________________
Name:                            Name:
Title:                           Title:
Date:                            Date:'),

('SAFE Agreement', 'Fundraising', 'Simple Agreement for Future Equity template', 'legal', 'SIMPLE AGREEMENT FOR FUTURE EQUITY

THIS CERTIFIES THAT in exchange for the payment by [INVESTOR NAME] ("Investor") of $[AMOUNT] ("Purchase Amount"), [COMPANY NAME], a [STATE] corporation (the "Company"), issues to the Investor the right to certain shares of the Company''s Capital Stock, subject to the terms described below.

1. EVENTS
(a) Equity Financing. If there is an Equity Financing before the termination of this Safe, the Company will automatically issue to the Investor a number of shares of Standard Preferred Stock equal to the Purchase Amount divided by the Discount Price.

(b) Liquidity Event. If there is a Liquidity Event before the termination of this Safe, the Investor will automatically be entitled to receive a portion of Proceeds equal to the greater of (i) the Purchase Amount or (ii) the amount payable on the number of shares of Common Stock equal to the Purchase Amount divided by the Liquidity Price.

(c) Dissolution Event. If there is a Dissolution Event before the termination of this Safe, the Investor will automatically be entitled to receive a portion of Proceeds equal to the Purchase Amount.

2. DEFINITIONS
"Discount Price" means the price per share equal to the Valuation Cap divided by the Company Capitalization.
"Valuation Cap" means $[VALUATION_CAP].

[COMPANY NAME]                    [INVESTOR NAME]
By: ____________________         By: ____________________
Name:                            Name:
Title:                           Title:
Date:                            Date:'),

('Investor Update Template', 'Communication', 'Monthly investor update email template', 'email', 'Subject: [COMPANY NAME] Monthly Update - [MONTH YEAR]

Hi [INVESTOR NAME],

Here''s our monthly update for [MONTH]:

📊 KEY METRICS
- Revenue: $[AMOUNT] ([X]% MoM growth)
- Users: [NUMBER] ([X]% MoM growth)
- MRR: $[AMOUNT]
- Burn Rate: $[AMOUNT]/month
- Runway: [X] months

🎯 KEY WINS THIS MONTH
1. [Achievement 1]
2. [Achievement 2]
3. [Achievement 3]

⚠️ KEY CHALLENGES
1. [Challenge 1] - [How we''re addressing it]
2. [Challenge 2] - [How we''re addressing it]

📈 PRODUCT UPDATES
- [Update 1]
- [Update 2]

👥 TEAM UPDATES
- [Hiring/Team news]

💰 FUNDRAISING STATUS
- [Update on current fundraising if applicable]

🙏 ASK
- [Specific help you need from investors]

As always, happy to jump on a call if you''d like to discuss anything in more detail.

Best,
[YOUR NAME]
[TITLE]'),

('Data Room Checklist', 'Due Diligence', 'Complete checklist of documents for due diligence', 'checklist', 'DUE DILIGENCE DATA ROOM CHECKLIST

CORPORATE DOCUMENTS
□ Certificate of Incorporation
□ Bylaws
□ Cap Table (fully diluted)
□ Board Meeting Minutes
□ Shareholder Agreements
□ Stock Option Plan
□ All SAFEs/Convertible Notes

FINANCIAL DOCUMENTS
□ Historical Financial Statements (3 years)
□ Current Year Budget vs. Actuals
□ Revenue Model & Projections
□ Cash Flow Statements
□ Bank Statements (recent 6 months)
□ Accounts Receivable Aging
□ Accounts Payable Aging

LEGAL DOCUMENTS
□ All Material Contracts
□ Customer Agreements (templates + largest)
□ Vendor Agreements
□ Partnership Agreements
□ Lease Agreements
□ Intellectual Property Assignments
□ Employment Agreements
□ Consultant Agreements
□ NDAs with Key Parties

INTELLECTUAL PROPERTY
□ Patent Applications/Grants
□ Trademark Registrations
□ Copyright Registrations
□ Domain Name Registrations
□ IP Assignment Agreements
□ Licensing Agreements

PRODUCT & TECHNOLOGY
□ Product Roadmap
□ Technical Architecture Documentation
□ Security & Compliance Certifications
□ Privacy Policy & Terms of Service
□ Data Processing Agreements

CUSTOMER & MARKET
□ Customer List (anonymized if needed)
□ Customer Cohort Analysis
□ Market Research & Analysis
□ Competitive Analysis
□ Sales Pipeline Report

TEAM
□ Organization Chart
□ Employee Census
□ Equity Ownership by Employee
□ Employment Offer Letters
□ Contractor Agreements'),

('Pitch Deck Outline', 'Fundraising', 'Standard pitch deck structure and content guide', 'guide', 'PITCH DECK OUTLINE (10-15 slides)

SLIDE 1: COVER
- Company name & logo
- Tagline/one-liner
- Contact information
- "Confidential" notation

SLIDE 2: PROBLEM
- What pain point are you solving?
- Who experiences this problem?
- Quantify the problem (market data, cost, time)
- Make it relatable

SLIDE 3: SOLUTION
- Your product/service
- How it solves the problem
- Key features/benefits
- Why now?

SLIDE 4: PRODUCT DEMO
- Screenshots/visuals of product
- User flow
- Key differentiators
- Keep it simple and visual

SLIDE 5: MARKET OPPORTUNITY
- TAM (Total Addressable Market)
- SAM (Serviceable Addressable Market)
- SOM (Serviceable Obtainable Market)
- Market trends and growth

SLIDE 6: BUSINESS MODEL
- How you make money
- Pricing strategy
- Unit economics (CAC, LTV)
- Revenue streams

SLIDE 7: TRACTION
- Key metrics and growth
- Customer testimonials
- Partnerships/logos
- Milestones achieved

SLIDE 8: COMPETITION
- Competitive landscape
- Your unique advantage
- Barriers to entry
- Why you''ll win

SLIDE 9: GO-TO-MARKET STRATEGY
- Customer acquisition channels
- Sales strategy
- Marketing approach
- Partnerships

SLIDE 10: TEAM
- Founders (photos + bios)
- Key team members
- Advisors
- Why this team will succeed

SLIDE 11: FINANCIALS
- Historical revenue (if applicable)
- 3-year projections
- Key assumptions
- Path to profitability

SLIDE 12: THE ASK
- How much you''re raising
- Use of funds (breakdown)
- Key milestones this funding enables
- Timeline

TIPS:
- Keep slides visual and minimal text
- Tell a compelling story
- Practice your delivery
- Have appendix slides for deep dives');
