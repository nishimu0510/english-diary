export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, database_id, japanese, english, context } = req.body;

  if (!token || !database_id) {
    return res.status(400).json({ error: 'Missing token or database_id' });
  }

  const today = new Date().toISOString().split('T')[0];

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
        Name: {
          title: [{ text: { content: `Diary ${today}` } }],
        },
        Date: {
          date: { start: today },
        },
      },
      children: [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: 'Summary (7 Items)' } }] },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: japanese || '' } }] },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: 'Revised Diary' } }] },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: english || '' } }] },
        },
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: 'Context (JP)' } }] },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: context || '' } }] },
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    return res.status(response.status).json(error);
  }

  const data = await response.json();
  return res.status(200).json(data);
}
