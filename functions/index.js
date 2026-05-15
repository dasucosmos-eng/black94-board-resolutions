import { onRequest } from 'firebase-functions/v2/https';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin (uses default service account credentials in Cloud Functions)
if (!getApps().length) {
  initializeApp();
}

const ZAI_API_KEY = 'c5028ebdb86e4a2f8575ff2c70a686cf.Afesd3OL7eL7VHvn';
const ZAI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const BUCKET_NAME = 'black94-board-resolutions.appspot.com';
const DATA_FILE = 'resolutions_data.json';

// Helper: read data from Cloud Storage
async function readData() {
  try {
    const bucket = getStorage().bucket(BUCKET_NAME);
    const file = bucket.file(DATA_FILE);
    const [exists] = await file.exists();
    if (!exists) return { resolutions: [], settings: null, signature: null, stamp: null };
    const [content] = await file.download();
    return JSON.parse(content.toString());
  } catch (err) {
    console.error('Read data error:', err);
    return { resolutions: [], settings: null, signature: null, stamp: null };
  }
}

// Helper: write data to Cloud Storage
async function writeData(data) {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const file = bucket.file(DATA_FILE);
  await file.save(JSON.stringify(data), { contentType: 'application/json', resumable: false });
}

const aiHandler = onRequest({
  region: 'asia-south1',
  invoker: 'public',
}, async (req, res) => {
  // CORS handling
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const urlPath = req.path || '';

    // --- DATA STORAGE: Load all data ---
    if (req.method === 'GET' && (urlPath === '/data' || urlPath === '/data/')) {
      const data = await readData();
      res.status(200).json(data);
      return;
    }

    // --- DATA STORAGE: Save all data ---
    if (req.method === 'PUT' && (urlPath === '/data' || urlPath === '/data/')) {
      const data = req.body;
      await writeData(data);
      res.status(200).json({ success: true });
      return;
    }

    // --- AI UNIVERSAL HANDLER (supports type field for routing) ---
    if (req.method === 'POST') {
      const { description, settings, type, messages } = req.body || {};

      if (!description || !description.trim()) {
        // Allow chat type with messages instead of description
        if (type === 'chat' && messages && messages.length > 0) {
          // proceed to chat handling below
        } else {
          res.status(400).json({ error: 'Description is required' });
          return;
        }
      }

      const companyName = settings?.companyName || 'Black94';
      const legalName = settings?.legalName || 'PRABHU DASU PALLI';
      const constitution = settings?.constitution || 'Proprietorship';
      const gstin = settings?.gstin || '37DFRPP8787L1Z0';
      const address = settings?.address || '';
      const state = settings?.state || '';
      const district = settings?.district || '';
      const authorityName = settings?.authorityName || '';
      const authorityTitle = settings?.authorityTitle || 'Proprietor';

      // --- CHAT TYPE: AI Business Assistant ---
      if (type === 'chat') {
        const chatSystemPrompt = `You are an AI Business Assistant for ${companyName} (${legalName}), a ${constitution} firm with GSTIN ${gstin}, located at ${address}, ${state}. You have deep knowledge of the company's operations, documents, and history. You help with: generating documents, answering questions about company data, drafting contracts and policies, providing compliance guidance, and offering business insights. Be professional, concise, and helpful. If asked to generate a document, write the full document text. If asked a question, answer directly based on the company context provided.`;
        
        const chatMessages = messages && messages.length > 0 ? messages : [
          { role: 'user', content: description }
        ];

        const aiResponse = await fetch(ZAI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZAI_API_KEY}` },
          body: JSON.stringify({
            model: 'glm-4-plus',
            messages: [
              { role: 'system', content: chatSystemPrompt },
              ...chatMessages.map((m) => ({ role: m.role, content: m.content }))
            ],
            temperature: 0.4,
            max_tokens: 4000,
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error('Chat AI error:', aiResponse.status, errText);
          res.status(502).json({ error: 'AI temporarily unavailable' });
          return;
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        res.status(200).json({ response: content });
        return;
      }

      // --- NDA/CONTRACT/POLICY TYPE ---
      if (type === 'nda' || type === 'contract' || type === 'policy') {
        const docType = type === 'nda' ? 'Non-Disclosure Agreement' : type === 'contract' ? 'Contract/Agreement' : 'Company Policy';
        const docPrompt = `You are a senior corporate lawyer. Generate a complete, professional ${docType} for ${legalName}, a ${constitution} with GSTIN ${gstin}, address: ${address}, ${state}.

Company: ${companyName}
Legal Entity: ${legalName}
Constitution: ${constitution}
${settings?.authorityName ? `Authorized Signatory: ${settings.authorityName} (${settings.authorityTitle || authorityTitle})` : ''}

Request: ${description}

Generate the COMPLETE document with all standard clauses, proper formatting, and legal language. Include: title, parties, recitals/whereas clauses, main terms, obligations, termination, governing law, signatures block. Output the full document text only.`;

        const aiResponse = await fetch(ZAI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZAI_API_KEY}` },
          body: JSON.stringify({
            model: 'glm-4-plus',
            messages: [
              { role: 'system', content: `You are an expert Indian corporate lawyer. Generate complete, legally sound documents.` },
              { role: 'user', content: docPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        res.status(200).json({ document: content, title: `${docType} - ${companyName}` });
        return;
      }

      // --- COMPLIANCE TYPE ---
      if (type === 'compliance') {
        const compliancePrompt = `You are a compliance expert for Indian businesses. Review the compliance status for ${legalName} (${constitution}, GSTIN: ${gstin}).

Company data: ${JSON.stringify(settings || {})}

Review request: ${description}

Provide a detailed compliance analysis with:
1. Current status assessment
2. Issues found (if any)
3. Recommended actions
4. Upcoming deadlines
5. Risk level (Low/Medium/High)

Format as clear, actionable text.`;

        const aiResponse = await fetch(ZAI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZAI_API_KEY}` },
          body: JSON.stringify({
            model: 'glm-4-plus',
            messages: [
              { role: 'system', content: 'You are an Indian business compliance expert.' },
              { role: 'user', content: compliancePrompt }
            ],
            temperature: 0.3,
            max_tokens: 3000,
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        res.status(200).json({ analysis: content });
        return;
      }

      // --- REPORT TYPE ---
      if (type === 'report') {
        const reportPrompt = `Generate a professional business report for ${companyName} (${legalName}), ${constitution}.

Company: ${JSON.stringify(settings || {})}

Report request: ${description}

Write a comprehensive, well-structured report with executive summary, detailed findings, and recommendations. Use professional business language.`;

        const aiResponse = await fetch(ZAI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZAI_API_KEY}` },
          body: JSON.stringify({
            model: 'glm-4-plus',
            messages: [
              { role: 'system', content: 'You are a business analyst generating professional reports.' },
              { role: 'user', content: reportPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        res.status(200).json({ report: content });
        return;
      }

      // --- CLAUSE ANALYSIS TYPE ---
      if (type === 'clause-analysis') {
        const analysisPrompt = `You are a senior contract lawyer. Analyze the following contract text and identify:

1. RISKY CLAUSES (things that could harm ${companyName})
2. MISSING PROTECTIONS (standard protections absent)
3. ONE-SIDED TERMS (unfairly favoring the other party)
4. LIABILITY EXPOSURE (potential financial/legal risks)
5. IP OWNERSHIP ISSUES
6. TERMINATION CONCERNS
7. OVERALL RISK ASSESSMENT (Low/Medium/High)

Contract text to analyze:
${description}

Provide specific, actionable analysis. Reference exact clauses. Give clear recommendations.`;

        const aiResponse = await fetch(ZAI_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZAI_API_KEY}` },
          body: JSON.stringify({
            model: 'glm-4-plus',
            messages: [
              { role: 'system', content: `You are a senior Indian contract lawyer reviewing agreements for ${companyName}.` },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || '';
        res.status(200).json({ analysis: content });
        return;
      }

      // --- DEFAULT: BOARD RESOLUTION GENERATION ---

      const systemPrompt = `You are a senior corporate lawyer and board secretary with 25+ years of experience drafting Indian Board Resolutions for proprietorship firms registered under GST. Your task is to transform a plain English description into a polished, legally sound board resolution that would be accepted by any bank, government authority, or regulatory body in India.

═══ COMPANY PROFILE (STRICTLY USE THESE DETAILS) ═══
Company/Brand Name: ${companyName}
Legal Entity Name: ${legalName}
Constitution: ${constitution}
GSTIN: ${gstin}
Registered Address: ${address}
State: ${state}
District: ${district}
Authorized Signatory: ${authorityName}
Designation: ${authorityTitle}

═══ CRITICAL INSTRUCTIONS ═══

1. DEEP UNDERSTANDING: Read the user's description carefully. Understand the INTENT behind the request, not just the words. A user saying "open bank account" means they need a resolution authorizing the proprietor to open AND operate a bank account with specific banking powers.

2. INDIAN LEGAL COMPLIANCE: Every resolution must comply with:
   - Indian Companies Act principles (as applicable to proprietorship)
   - GST regulations
   - RBI guidelines for banking resolutions
   - Relevant state government requirements

3. COMPANY IDENTITY:
   - ALWAYS use "${legalName}" as the entity name in the preamble and resolved text
   - Reference "${constitution}" nature of business
   - Use the GSTIN "${gstin}" where relevant for tax-related resolutions
   - Address at "${address}"

4. RESOLUTION ANATOMY - Generate a COMPLETE, PROFESSIONAL resolution:

   a) TITLE: A precise, formal title in Title Case. Examples:
      - "Resolution for Opening of Current Bank Account with [Bank Name]"
      - "Resolution for Appointment of Authorized Signatory for GST Filings"
      - "Resolution for Approval of Annual Financial Statements for FY 2024-25"

   b) PREAMBLE (WHEREAS clause): Write 2-3 sentences explaining:
      - The business context and WHY this resolution is needed
      - The legal/regulatory requirement driving it
      - Reference the company's business activities

   c) RESOLVED TEXT: Write 4-6 comprehensive sentences that:
      - Start with "RESOLVED THAT"
      - Specifically authorize "${authorityName}" (${authorityTitle})
      - Include ALL specific details from the description (bank name, branch, account type, amounts, IFSC, etc.)
      - Grant necessary powers (to sign, operate, execute documents, etc.)
      - Mention compliance with applicable laws
      - Include any conditions or limitations mentioned
      - End with authority to do all acts as may be deemed necessary

5. FIELD EXTRACTION:
   - proposer/resolvedBy: Extract name from description, or default to "${authorityName}"
   - seconded: Extract if mentioned, otherwise empty string ""
   - venue: Default to "Registered Office, ${district}" unless specified

6. ABSOLUTELY DO NOT:
   - Copy the user's input verbatim — rewrite in formal legal language
   - Add generic filler — every sentence must serve a legal purpose
   - Forget to include specific details (names, numbers, dates, amounts)
   - Use the brand name alone — use the legal entity name in formal context

OUTPUT FORMAT: Respond with ONLY valid JSON. No markdown, no code blocks, no explanation.
{
  "title": "Formal Title Case title",
  "preamble": "WHEREAS, [2-3 sentences of context]...",
  "resolvedText": "RESOLVED THAT, [4-6 comprehensive sentences with all details]...",
  "venue": "Registered Office, ${district}",
  "resolvedBy": "Name of proposer",
  "secondedBy": "Name of seconder or empty string",
  "authorityName": "${authorityName}",
  "authorityTitle": "${authorityTitle}"
}`;

      const aiResponse = await fetch(ZAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'glm-4-plus',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Draft a professional board resolution based on this request:\n\n${description}` }
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('ZhipuAI API error:', aiResponse.status, errText);
        res.status(502).json({ error: 'AI service temporarily unavailable. Please try again.' });
        return;
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr, 'Content:', content);
        res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
        return;
      }

      res.status(200).json({
        title: parsed.title || '',
        preamble: parsed.preamble || '',
        resolvedText: parsed.resolvedText || '',
        venue: parsed.venue || `Registered Office, ${district}`,
        resolvedBy: parsed.resolvedBy || authorityName,
        secondedBy: parsed.secondedBy || '',
        authorityName: parsed.authorityName || authorityName,
        authorityTitle: parsed.authorityTitle || authorityTitle,
      });
      return;
    }

    res.status(404).json({ error: 'Endpoint not found. Use POST / for AI generation, GET/PUT /data for data storage.' });

  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Internal server error: ' + (err.message || 'Unknown') });
  }
});

export { aiHandler };
