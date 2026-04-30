export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { messages, system } = req.body;

    // Formato Groq (compatible con OpenAI)
    const groqMessages = [
      { role: 'system', content: system },
      ...messages
    ];

    // Llamada a Groq — GRATIS, API key segura en el servidor
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1000,
        temperature: 0.7,
        messages: groqMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Error Groq:', err);
      return res.status(response.status).json({ error: 'Error del servidor de IA' });
    }

    const data = await response.json();

    // Adaptar al formato que espera el frontend de NaturIA
    const text = data.choices?.[0]?.message?.content || 'Sin respuesta.';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
