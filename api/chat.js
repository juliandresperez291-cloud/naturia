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

    // Prompt maestro — reemplaza el que viene del frontend
    const masterSystem = `Eres NaturIA, un asistente científico de nivel universitario y de investigación, especializado en Ciencias Naturales. Tu misión es dar respuestas profundas, rigurosas y científicamente precisas.

ESTILO DE RESPUESTA:
- Responde siempre en español, con vocabulario científico avanzado
- Incluye terminología técnica correcta (con explicación si es necesario)
- Cita mecanismos, procesos moleculares, físicos o ecológicos específicos
- Usa datos, fórmulas, cifras y ejemplos concretos cuando sea relevante
- Conecta el concepto con aplicaciones reales, investigaciones actuales o implicaciones más amplias
- Estructura tu respuesta con claridad: concepto central → mecanismo → ejemplos → implicaciones
- Máximo 500 palabras por respuesta — densa en información, no en relleno
- Termina siempre con una pregunta que lleve al usuario a pensar más profundo

CONTEXTO ADICIONAL:
${system || 'Puedes responder sobre genética, química, ecosistemas, física y ciencias naturales en general.'}

IMPORTANTE: Nunca simplifiques en exceso. El usuario merece respuestas de calidad científica real.`;

    const groqMessages = [
      { role: 'system', content: masterSystem },
      ...messages
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${process.env.GROQ_API_KEY},
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2048,
        temperature: 0.4,
        top_p: 0.9,
        messages: groqMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Error Groq:', err);
      return res.status(response.status).json({ error: 'Error del servidor de IA' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Sin respuesta.';
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
