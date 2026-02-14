const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Tüm diller (Kürtçe eklendi)
const languagePrompts = {
  tr: 'Turkce',
  ku: 'Kurdi', // 🆕 Kürtçe
  en: 'English',
  de: 'Deutsch',
  fr: 'Francais',
  es: 'Espanol',
  ar: 'العربية',
  zh: '中文',
  ja: '日本語',
  ko: '한국어'
};

// Dil algılama için sistem mesajı
const detectionPrompt = `Kullanicinin hangi dilde konustugunu tespit et ve sadece dil kodunu dondur.
Mevcut diller: tr (Turkce), ku (Kurdi/Kurtce), en (English), de (Deutsch), fr (Francais), es (Espanol), ar (Arapca), zh (Cince), ja (Japonca), ko (Korece).

Ornekler:
- "Merhaba nasilsin?" -> tr
- "Ez başım, tu çawa yî?" -> ku
- "Hello how are you?" -> en
- "Wie geht es dir?" -> de

Sadece dil kodunu yaz (tr, ku, en, vb.).`;

class OpenAIService {
  // DIL ALGILAMA
  async detectLanguage(message) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: detectionPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0,
        max_tokens: 10
      });

      const detectedLang = response.choices[0].message.content.trim().toLowerCase();
      const supportedLangs = ['tr', 'ku', 'en', 'de', 'fr', 'es', 'ar', 'zh', 'ja', 'ko'];
      return supportedLangs.includes(detectedLang) ? detectedLang : 'tr';
    } catch (error) {
      console.error('Dil algilama hatasi:', error);
      return 'tr';
    }
  }

  // OTOMATIK DIL - Algılanan dile göre cevap ver
  async generateAutoResponse(message, personalityPrompt, memory = [], avatarName = 'Avatar') {
    try {
      const detectedLang = await this.detectLanguage(message);
      const langName = languagePrompts[detectedLang] || 'Turkce';
      
      const systemPrompt = `Sen ${avatarName} adli bir dijital avatarsin. 
      Kisiligin: ${personalityPrompt}.
      Kullanici sana ${langName} dilinde konustu. Sen de ${langName} dilinde cevap ver.
      Samimi, sicak ve dogal ol. Kisa cevaplar ver (max 2-3 cumle).`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
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

      return {
        response: response.choices[0].message.content,
        language: detectedLang,
        languageName: langName
      };
    } catch (error) {
      console.error('Otomatik dil hatasi:', error);
      throw new Error('Yanit olusturulamadi');
    }
  }
}

module.exports = new OpenAIService();
