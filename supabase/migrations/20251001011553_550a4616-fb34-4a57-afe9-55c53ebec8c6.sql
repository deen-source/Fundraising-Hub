-- Insert sample document templates with placeholders
INSERT INTO public.document_templates (name, category, template_type, description, content)
VALUES
  (
    'Investor Update Email',
    'Communication',
    'email',
    'Monthly or quarterly update template for keeping investors informed',
    E'Subject: {{COMPANY_NAME}} - {{CURRENT_DATE}} Investor Update

Dear Investors,

I hope this email finds you well. I''m writing to share our progress at {{COMPANY_NAME}} for this period.

**Key Highlights:**
• [Metric 1]: [Achievement]
• [Metric 2]: [Achievement]
• [Metric 3]: [Achievement]

**Product Development:**
[Brief update on product progress, features launched, technical milestones]

**Business Metrics:**
• Revenue: [Amount] ([X]% growth)
• Users/Customers: [Number] ([X]% growth)
• Key Partnerships: [Recent partnerships or deals]

**Team Updates:**
[New hires, team expansions, key promotions]

**Challenges & Learnings:**
[Be transparent about obstacles and how you''re addressing them]

**What''s Next:**
[Preview of next quarter''s goals and priorities]

**Ask:**
[Specific ways investors can help - introductions, advice, etc.]

Thank you for your continued support and belief in our vision.

Best regards,
{{FOUNDER_NAME}}
CEO, {{COMPANY_NAME}}
{{FOUNDER_EMAIL}} | {{COMPANY_WEBSITE}}'
  ),
  (
    'SAFE Agreement',
    'Legal',
    'agreement',
    'Simple Agreement for Future Equity template',
    E'SIMPLE AGREEMENT FOR FUTURE EQUITY

THIS CERTIFIES THAT in exchange for the payment by [Investor Name] (the "Investor") of $[Investment Amount] (the "Purchase Amount") on or about [Date], {{COMPANY_NAME}}, a Delaware corporation (the "Company"), issues to the Investor the right to certain shares of the Company''s Capital Stock, subject to the terms described below.

1. EVENTS

(a) Equity Financing. If there is an Equity Financing before the termination of this Safe, on the initial closing of such Equity Financing, this Safe will automatically convert into the number of shares of Standard Preferred Stock equal to the Purchase Amount divided by the Conversion Price.

(b) Liquidity Event. If there is a Liquidity Event before the termination of this Safe, this Safe will automatically be entitled (subject to the liquidation priority set forth in Section 1(d) below) to receive a portion of Proceeds equal to the Purchase Amount.

(c) Dissolution Event. If there is a Dissolution Event before the termination of this Safe, the Investor will automatically be entitled (subject to the liquidation priority set forth in Section 1(d) below) to receive a portion of Proceeds, due and payable to the Investor.

2. DEFINITIONS

"Capital Stock" means the capital stock of the Company, including, without limitation, the "Common Stock" and the "Preferred Stock."

"Company Capitalization" is calculated as of immediately prior to the Equity Financing and (without duplication):
• Includes all shares of Capital Stock issued and outstanding
• Includes all Converting Securities
• Includes all (i) issued and outstanding Options and (ii) Promised Options

3. COMPANY REPRESENTATIONS

(a) The Company is a corporation duly organized, validly existing and in good standing under the laws of the State of Delaware.

(b) The execution, delivery and performance by the Company of this Safe is within the power of the Company.

4. INVESTOR REPRESENTATIONS

(a) The Investor has full legal capacity, power and authority to execute and deliver this Safe.

(b) This Safe constitutes legal, valid and binding obligation of the Investor.

5. MISCELLANEOUS

(a) Any provision of this Safe may be amended, waived or modified by written consent of the Company and the Investor.

(b) This Safe shall be governed by and construed under the laws of the State of Delaware.

IN WITNESS WHEREOF, the undersigned have caused this Safe to be duly executed and delivered.

{{COMPANY_NAME}}

By: _______________________
Name: {{FOUNDER_NAME}}
Title: Chief Executive Officer
Date: {{CURRENT_DATE}}

Company Address:
{{COMPANY_ADDRESS}}
{{COMPANY_CITY}}, {{COMPANY_STATE}} {{COMPANY_ZIP}}

INVESTOR:

By: _______________________
Name: [Investor Name]
Date: _______________________'
  ),
  (
    'Board Meeting Minutes',
    'Legal',
    'minutes',
    'Template for documenting board meeting minutes',
    E'MINUTES OF MEETING OF THE BOARD OF DIRECTORS OF
{{COMPANY_NAME}}

Date: {{CURRENT_DATE}}
Time: [Time]
Location: [Location / Virtual]

**PRESENT:**
• {{FOUNDER_NAME}}, CEO and Director
• [Director Name], Director
• [Director Name], Director

**ABSENT:**
• [If any]

**ALSO PRESENT:**
• [Other attendees, if any]

**CALL TO ORDER:**
The meeting was called to order at [Time] by {{FOUNDER_NAME}}.

**AGENDA:**

1. **Approval of Previous Minutes**
   The minutes of the [previous meeting date] were reviewed and approved unanimously.

2. **Financial Report**
   [CFO/Treasurer Name] presented the financial report for [period].
   • Revenue: [Amount]
   • Expenses: [Amount]
   • Cash Position: [Amount]
   • Burn Rate: [Amount/month]
   
   The financial report was accepted by unanimous vote.

3. **Business Update**
   {{FOUNDER_NAME}} provided updates on:
   • Product development progress
   • Customer acquisition and retention
   • Key partnerships and business development
   • Team and hiring

4. **Fundraising Discussion**
   Discussion of current fundraising efforts:
   • Target raise amount: [Amount]
   • Terms being considered
   • Investor pipeline and status
   
   **RESOLUTION:** The Board authorized the CEO to continue fundraising discussions and negotiate terms within the parameters discussed.

5. **Stock Option Grants**
   **RESOLUTION:** The Board approved stock option grants to:
   • [Employee Name]: [Number] options at $[Price] per share
   • [Employee Name]: [Number] options at $[Price] per share

6. **Other Business**
   [Any other matters discussed]

**ADJOURNMENT:**
There being no further business, the meeting was adjourned at [Time].

Respectfully submitted,

_______________________
[Secretary Name]
Secretary

Approved by the Board:

_______________________          Date: _______
{{FOUNDER_NAME}}, Director

_______________________          Date: _______
[Director Name], Director'
  ),
  (
    'Term Sheet Template',
    'Fundraising',
    'term_sheet',
    'Standard venture capital term sheet template',
    E'TERM SHEET FOR SERIES [A/B/C] PREFERRED STOCK FINANCING OF
{{COMPANY_NAME}}

This Term Sheet summarizes the principal terms with respect to a potential Series [A/B/C] Preferred Stock financing of {{COMPANY_NAME}}, a Delaware corporation (the "Company"). This Term Sheet is intended solely as a basis for further discussion and is not intended to be and does not constitute a legally binding obligation.

Date: {{CURRENT_DATE}}

**OFFERING TERMS**

Issuer: {{COMPANY_NAME}}

Amount to be Raised: $[Amount] (the "Financing")

Pre-Money Valuation: $[Amount]

Post-Money Valuation: $[Amount]

Price Per Share: $[Price] (based on a Fully-Diluted Capitalization of [Number] shares)

**TERMS OF SERIES [A/B/C] PREFERRED STOCK**

Dividends: [X]% non-cumulative dividend, when and if declared by the Board

Liquidation Preference: [1x] the original purchase price plus declared but unpaid dividends on each share of Series [A/B/C] Preferred, or [alternative structure]. After payment of the Series [A/B/C] Preferred liquidation preference, the remaining assets shall be distributed pro rata to holders of Common Stock and Preferred Stock on an as-converted basis.

Conversion: Each share of Series [A/B/C] Preferred is convertible into one share of Common Stock at any time at the option of the holder, subject to adjustment for stock splits, dividends, etc.

Automatic Conversion: Each share of Series [A/B/C] Preferred will automatically convert into Common Stock upon (i) the closing of a firmly underwritten public offering with aggregate proceeds of at least $[Amount] at a per share price of at least [X] times the Series [A/B/C] Original Purchase Price, or (ii) the consent of holders of [X]% of the then outstanding Series [A/B/C] Preferred Stock.

Anti-dilution Provisions: [Weighted average / Broad-based weighted average / None]

Voting Rights: Series [A/B/C] Preferred will vote together with the Common Stock on an as-converted basis.

**INVESTORS'' RIGHTS**

Information Rights: Investors purchasing at least $[Amount] of Series [A/B/C] Preferred will have the right to receive annual, quarterly, and monthly financial statements.

Board Representation: The Board shall consist of [Number] members:
• [Number] appointed by Common stockholders
• [Number] appointed by Series [A/B/C] investors
• [Number] mutually agreed independent directors

Protective Provisions: The Company will not, without approval of [X]% of the Series [A/B/C] Preferred:
• Alter the rights of Series [A/B/C] Preferred
• Increase or decrease authorized shares of Preferred Stock
• Declare or pay dividends
• Liquidate, dissolve, or wind-up the Company
• Acquire or dispose of material assets

**OTHER MATTERS**

Right of First Refusal: Investors will have the right to purchase their pro rata share of any new securities issued by the Company.

Drag-Along Rights: Holders of Preferred Stock and the Founders will agree to vote for a sale of the Company approved by the Board and [X]% of the Preferred Stock.

Registration Rights: [Details on demand and piggyback registration rights]

Vesting: All Founder shares will be subject to [4] year vesting with a [1] year cliff.

Employee Option Pool: The Company will reserve [X]% of the post-financing fully-diluted capitalization for employee stock options.

Expenses: The Company will pay reasonable legal fees and expenses of the investors, up to $[Amount].

Exclusivity: The Company agrees to work exclusively with the Investors for [X] days from the date of this Term Sheet.

**COMPANY INFORMATION**

{{COMPANY_NAME}}
{{COMPANY_ADDRESS}}
{{COMPANY_CITY}}, {{COMPANY_STATE}} {{COMPANY_ZIP}}
{{COMPANY_WEBSITE}}
Contact: {{FOUNDER_NAME}}, CEO
Email: {{FOUNDER_EMAIL}}
Phone: {{COMPANY_PHONE}}

This term sheet does not constitute a binding agreement and is subject to the completion of due diligence and execution of definitive agreements.'
  ),
  (
    'NDA Template',
    'Legal',
    'agreement',
    'Mutual Non-Disclosure Agreement template',
    E'MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement (this "Agreement") is entered into as of {{CURRENT_DATE}} (the "Effective Date") by and between:

{{COMPANY_NAME}}, a Delaware corporation
Address: {{COMPANY_ADDRESS}}, {{COMPANY_CITY}}, {{COMPANY_STATE}} {{COMPANY_ZIP}}
("First Party")

and

[Other Party Name], a [State] [corporation/LLC]
Address: [Address]
("Second Party")

(Each a "Party" and collectively, the "Parties")

**RECITALS**

WHEREAS, the Parties wish to explore a business opportunity of mutual interest (the "Transaction") and, in connection with the Transaction, each Party may disclose to the other certain confidential information to enable the other to evaluate the proposed Transaction.

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

**1. DEFINITION OF CONFIDENTIAL INFORMATION**

"Confidential Information" means all information, whether written, oral, visual, electronic or other form, disclosed by one Party (the "Disclosing Party") to the other Party (the "Receiving Party") in connection with the Transaction, including but not limited to:

(a) Technical information, including patent and patent applications, trade secrets, research, product plans, products, developments, inventions, processes, designs, drawings, engineering, marketing and finances;

(b) Business information, including customer lists, supplier lists, pricing, costs, profits, markets, sales, and strategic plans;

(c) Any information that is marked or identified as "Confidential" or with a similar designation.

**2. EXCLUSIONS FROM CONFIDENTIAL INFORMATION**

Confidential Information shall not include information that:

(a) Is or becomes generally available to the public other than as a result of disclosure by the Receiving Party in breach of this Agreement;

(b) Was known to the Receiving Party prior to disclosure by the Disclosing Party;

(c) Becomes known to the Receiving Party from a source other than the Disclosing Party without breach of this Agreement;

(d) Is independently developed by the Receiving Party without use of or reference to the Confidential Information.

**3. OBLIGATIONS OF RECEIVING PARTY**

The Receiving Party agrees to:

(a) Hold the Confidential Information in strict confidence;

(b) Not disclose the Confidential Information to third parties without prior written consent of the Disclosing Party;

(c) Not use the Confidential Information for any purpose except to evaluate and pursue the Transaction;

(d) Protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but no less than reasonable care;

(e) Limit disclosure of Confidential Information to employees, consultants and advisors who need to know and who are bound by similar confidentiality obligations.

**4. TERM**

This Agreement shall commence on the Effective Date and shall continue for a period of [2/3/5] years unless earlier terminated by either Party with [30] days written notice.

**5. RETURN OF MATERIALS**

Upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information, including all copies, notes, and derivatives.

**6. NO LICENSE**

Nothing in this Agreement grants any license or right in any intellectual property of the Disclosing Party to the Receiving Party.

**7. GOVERNING LAW**

This Agreement shall be governed by the laws of the State of Delaware without regard to its conflict of laws provisions.

**8. ENTIRE AGREEMENT**

This Agreement constitutes the entire agreement between the Parties concerning the subject matter hereof and supersedes all prior agreements and understandings.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

{{COMPANY_NAME}}

By: _______________________
Name: {{FOUNDER_NAME}}
Title: Chief Executive Officer
Date: {{CURRENT_DATE}}

[OTHER PARTY NAME]

By: _______________________
Name: [Name]
Title: [Title]
Date: _______________________'
  ),
  (
    'Executive Summary',
    'Due Diligence',
    'document',
    'Company executive summary for investors',
    E'EXECUTIVE SUMMARY
{{COMPANY_NAME}}

**Company Overview**
{{COMPANY_NAME}} is a {{COMPANY_INDUSTRY}} company founded in {{INCORPORATION_DATE}}. {{COMPANY_DESCRIPTION}}

**Contact Information**
Website: {{COMPANY_WEBSITE}}
Email: {{FOUNDER_EMAIL}}
Phone: {{COMPANY_PHONE}}
Address: {{COMPANY_ADDRESS}}, {{COMPANY_CITY}}, {{COMPANY_STATE}} {{COMPANY_ZIP}}

**The Problem**
[Describe the problem your company solves. Be specific about the pain points your target customers experience.]

**The Solution**
[Describe your product/service and how it solves the problem. What makes it unique?]

**Market Opportunity**
• Total Addressable Market (TAM): [Amount]
• Serviceable Addressable Market (SAM): [Amount]
• Serviceable Obtainable Market (SOM): [Amount]
• Market Growth Rate: [X]% annually

**Business Model**
• Revenue Streams: [List primary revenue sources]
• Pricing: [Pricing strategy and structure]
• Customer Acquisition Cost (CAC): [Amount]
• Lifetime Value (LTV): [Amount]
• LTV:CAC Ratio: [Ratio]

**Traction & Metrics**
• Customers: [Number]
• Monthly Recurring Revenue (MRR): [Amount]
• Annual Recurring Revenue (ARR): [Amount]
• Year-over-Year Growth: [X]%
• Key Partnerships: [List significant partnerships]

**Competitive Landscape**
[Brief overview of main competitors and your competitive advantages]

**Team**
• {{FOUNDER_NAME}}, CEO & Founder
  [Brief background and relevant experience]
• [Co-founder/Executive], [Title]
  [Brief background and relevant experience]
• [Key Team Member], [Title]
  [Brief background and relevant experience]

**Financial Highlights**
• Current Year Revenue: [Amount]
• Previous Year Revenue: [Amount]
• Gross Margin: [X]%
• Operating Expenses: [Amount]
• Current Runway: [X] months

**The Ask**
• Seeking: $[Amount]
• Use of Funds:
  - [X]% Product Development
  - [X]% Sales & Marketing
  - [X]% Operations & Hiring
  - [X]% Working Capital
• Expected Milestones:
  - [Milestone 1 with timeline]
  - [Milestone 2 with timeline]
  - [Milestone 3 with timeline]

**Investment Highlights**
• [Key reason 1 why this is an attractive investment]
• [Key reason 2 why this is an attractive investment]
• [Key reason 3 why this is an attractive investment]

**Exit Strategy**
[Brief discussion of potential exit opportunities and comparable exits in your space]

**Contact**
For more information or to schedule a meeting, please contact:

{{FOUNDER_NAME}}
Chief Executive Officer
{{FOUNDER_EMAIL}}
{{COMPANY_PHONE}}

{{COMPANY_NAME}}
{{COMPANY_WEBSITE}}

---
This document is confidential and proprietary to {{COMPANY_NAME}}. Distribution without permission is prohibited.
Date: {{CURRENT_DATE}}'
  )
ON CONFLICT (id) DO NOTHING;