import { onRequest } from 'firebase-functions/v2/https';
import { cors } from 'firebase-functions/v2/https';

const ZAI_API_KEY = 'c5028ebdb86e4a2f8575ff2c70a686cf.Afesd3OL7eL7VHvn';
const ZAI_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

const aiHandler = onRequest({ region: 'asia-south1' }, async (req, res) => {
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

      const systemPrompt = `You are an expert legal document writer specializing in Indian Board Resolutions for proprietorship firms. Convert a plain English description into a professional, legally-formatted board resolution.

COMPANY DETAILS:
- Company Name: ${settings?.companyName || 'Black94'}
- Legal Name: ${settings?.legalName || ''}
- Constitution: ${settings?.constitution || 'Proprietorship'}
- GSTIN: ${settings?.gstin || ''}
- Address: ${settings?.address || ''}
- State: ${settings?.state || ''}
- District: ${settings?.district || ''}
- Authority/Proprietor: ${settings?.authorityName || ''}
- Designation: ${settings?.authorityTitle || ''}

You MUST respond with ONLY valid JSON (no markdown, no code blocks, no extra text). The JSON must have exactly these fields:
{
  "title": "A concise, professional title in Title Case (e.g., Opening of Current Bank Account with State Bank of India)",
  "preamble": "A WHEREAS clause explaining the background/reason. Start with WHEREAS,",
  "resolvedText": "The full RESOLVED THAT text with formal legal language. Write 3-5 detailed sentences. Start with RESOLVED THAT, and include all specific details like bank names, amounts, people, dates, account types from the description.",
  "venue": "Meeting venue (default: Registered Office, ${settings?.district || ''} unless specified)",
  "resolvedBy": "Name of the person who proposed (extract from description, or use ${settings?.authorityName || ''})",
  "secondedBy": "Name of the person who seconded (extract if mentioned, otherwise empty string)",
  "authorityName": "${settings?.authorityName || ''}",
  "authorityTitle": "${settings?.authorityTitle || ''}"
}

RULES:
1. Extract ALL specific details from the description (names, bank names, amounts, dates, account types, IFSC codes, etc.)
2. Write the preamble as a single WHEREAS sentence with proper context
3. The resolvedText must be comprehensive - include all specifics mentioned
4. Use formal legal language: hereby approves, subject to applicable laws, as may be deemed necessary
5. Keep the title concise but descriptive (under 15 words)
6. The resolvedText should start with RESOLVED THAT, and be 3-5 well-crafted sentences
7. If proposer/seconder names are mentioned, extract them; if not, proposer defaults to authority
8. Output ONLY raw JSON, no markdown formatting, no code blocks`;

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
            { role: 'user', content: `Draft a professional board resolution from this description:\n\n${description}` }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('ZhipuAI API error:', aiResponse.status, errText);
        res.status(502).json({ error: 'AI service error' });
        return;
      }

      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      res.status(200).json({
        title: parsed.title || '',
        preamble: parsed.preamble || '',
        resolvedText: parsed.resolvedText || '',
        venue: parsed.venue || `Registered Office, ${settings?.district || ''}`,
        resolvedBy: parsed.resolvedBy || settings?.authorityName || '',
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
