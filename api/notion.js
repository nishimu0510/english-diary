export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, database_id, summary, revised, original, context } = req.body;

  if (!token || !database_id) {
    return res.status(400).json({ error: 'Missing token or database_id' });
  }

  const today = new Date().toISOString().split('T')[0];

  // Parse summary into rich_text segments with bold labels
  const summaryRichText = [];
  if (summary) {
    const lines = summary.split('\n');
    lines.forEach((line) => {
      const match = line.match(/^(①.*?:|②.*?:|③.*?:|④.*?:|⑤.*?:|⑥.*?:|⑦.*?:)\s*(.*)/);
      if (match) {
        if (summaryRichText.length > 0) {
          summaryRichText.push({ text: { content: '\n' } });
        }
        summaryRichText.push({
          text: { content: match[1] + '\n' },
          annotations: { bold: true },
        });
        if (match[2]) {
          summaryRichText.push({ text: { content: match[2] } });
        }
      } else if (line.trim()) {
        summaryRichText.push({ text: { content: line } });
      }
    });
  }
  if (summaryRichText.length === 0) {
    summaryRichText.push({ text: { content: summary || '' } });
  }

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify({
      parent: { database_id },
      properties: {
        Date: {
          date: { start: today },
        },
        Revised: {
          rich_text: [{ text: { content: revised || '' } }],
        },
        Original: {
          rich_text: [{ text: { content: original || '' } }],
        },
        Context: {
          rich_text: [{ text: { content: context || '' } }],
        },
        Summary: {
          rich_text: summaryRichText,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return res.status(response.status).json(error);
  }

  const data = await response.json();
  return res.status(200).json(data);
}
