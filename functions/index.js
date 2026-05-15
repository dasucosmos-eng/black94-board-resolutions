import { onRequest } from 'firebase-functions/v2/https';
import { cors } from 'firebase-functions/v2/https';
import ZAI from 'z-ai-web-dev-sdk';

const aiHandler = onRequest({ region: 'asia-south1' }, async (req, res) => {
  // Handle CORS
  cors({ origin: true })(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const { description, settings } = req.body;

      if (!description || !description.trim()) {
        res.status(400).json({ error: 'Description is required' });
        return;
      }

      const zai = await ZAI.create();

      const systemPrompt = `You are an expert legal assistant specializing in drafting board resolutions for Indian companies. You write in formal, professional corporate language.

Given a raw description from a user, you must create a polished, professional board resolution. You must extract and enhance all fields.

COMPANY INFO:
- Company Name: ${settings?.companyName || 'Black94'}
- Legal Name: ${settings?.legalName || ''}
- Constitution: ${settings?.constitution || 'Proprietorship'}
- GSTIN: ${settings?.gstin || ''}
- Address: ${settings?.address || ''}
- District: ${settings?.district || ''}
- State: ${settings?.state || ''}
- Default Authority: ${settings?.authorityName || ''}, ${settings?.authorityTitle || ''}

RULES:
1. "title" - Create a formal, concise title. Examples: "Approval of Annual Budget for FY 2025-26", "Appointment of Mr. Rajesh Kumar as Managing Director", "Opening of Current Bank Account with State Bank of India". Use Title Case.
2. "preamble" - Write 1-2 sentences of formal background/context explaining WHY this resolution is needed. Start with "WHEREAS," or similar formal language. Be specific and reference relevant facts from the description.
3. "resolvedText" - Write the formal resolution text starting with proper legal language. This is the core decision. It should be clear, complete, and actionable. Include all specific details mentioned (names, amounts, dates, terms, conditions). Use formal language like "hereby approves", "hereby authorizes", "hereby resolves". Write 3-5 sentences covering all aspects.
4. "venue" - Default to "Registered Office, ${settings?.district || ''}" unless the user specifies a different venue.
5. "resolvedBy" - Extract proposer name if mentioned, otherwise leave empty string.
6. "secondedBy" - Extract seconder name if mentioned, otherwise leave empty string.
7. "authorityName" and "authorityTitle" - Keep as default unless user specifies someone different.

IMPORTANT: Write the preamble and resolvedText in proper formal corporate legal language. Do NOT just copy-paste the user input. Polish it into professional resolution language.

Return ONLY valid JSON in this exact format, no markdown, no code blocks, no extra text:
{"title": "...", "preamble": "...", "resolvedText": "...", "venue": "...", "resolvedBy": "...", "secondedBy": "...", "authorityName": "...", "authorityTitle": "..."}`;

      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Draft a professional board resolution from this description:\n\n${description}` },
        ],
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      res.status(200).json({
        title: parsed.title || '',
        preamble: parsed.preamble || '',
        resolvedText: parsed.resolvedText || '',
        venue: parsed.venue || `Registered Office, ${settings?.district || ''}`,
        resolvedBy: parsed.resolvedBy || '',
        secondedBy: parsed.secondedBy || '',
        authorityName: parsed.authorityName || settings?.authorityName || '',
        authorityTitle: parsed.authorityTitle || settings?.authorityTitle || '',
      });
    } catch (err) {
      console.error('AI generation error:', err);
      res.status(500).json({ error: 'Failed to generate resolution: ' + (err.message || 'Unknown error') });
    }
  });
});

export { aiHandler };
