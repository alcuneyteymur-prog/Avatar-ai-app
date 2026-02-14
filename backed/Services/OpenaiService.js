const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const languagePrompts = {
  tr: 'Her zaman Turkce yanit ver. Samimi ve sicak bir Turkce kullan.',
  en: 'Always respond in English. Be friendly and natural.',
  de: 'Antworte immer auf Deutsch. Sei freundlich und naturlich.',
  fr: 'Reponds toujours en francais. Sois amical et naturel.',
  es: 'Responde siempre en espanol. Se amigable y natural.',
  ar: 'رد دائماً باللغة العربية الفصحى. كن ودوداً وطبيعياً.',
  zh: '请始终用简体中文回答。友好自然地交流。',
  ja: '常に日本語で返答してください。親しみやすく自然に話してください。',
  ko: '항상 한국어로 답변하세요. 친근하고 자연스럽게 대화하세요.'
};

class OpenAIService {
  async generateResponse(message, personalityPrompt, memory = [], language = 'tr') {
    try {
      const langPrompt = languagePrompts[language] || languagePrompts.tr;
      
      const messages = [
        {
          role: 'system',
          content: `Sen bir dijital avatarsin. Kisiligin: ${personalityPrompt}. 
          ${langPrompt}
          Samimi, sicak ve dogal bir sekilde konus. 
          Kisa ve oz cevaplar ver (max 2-3 cumle).`
        },
        ...memory.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: messages,
        temperature: 0.8,
        max_tokens: 200
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI hatasi:', error);
      throw new Error('Yanit olusturulamadi');
    }
  }
}

module.exports = new OpenAIService();
