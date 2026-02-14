const axios = require('axios');
const FormData = require('form-data');

class ElevenLabsService {
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    
    // Dile göre varsayılan sesler (Kürtçe eklendi)
    this.defaultVoices = {
      tr: 'pNInz6obpgDQGcFmaJgB', // Türkçe
      ku: 'yoZ06aMxZJJ28mfd3POQ', // 🆕 Kürtçe
      en: 'EXAVITQu4vr4xnSDxMaL', // İngilizce
      de: 'ErXwobaYiN019PkySvjV', // Almanca
      fr: 'ThT5KcBeYPX3keUQqHPh', // Fransızca
      es: 'TX3AE5VoIzMeN6rKPMj2', // İspanyolca
      ar: 'yoZ06aMxZJJ28mfd3POQ', // Arapça
      zh: 'N2lVS1w4EtoT3dr4eOWO', // Çince
      ja: 'ZRw5R7R8E41eDi9YhH1U', // Japonca
      ko: 'cS4q6Fxn8vW3r6jP9kLm'  // Korece
    };
  }

  async cloneVoice(audioBuffer, voiceName) {
    try {
      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('files', audioBuffer, { filename: 'voice_sample.mp3' });
      formData.append('description', `Cloned voice for ${voiceName}`);

      const response = await axios.post(
        `${this.baseUrl}/voices/add`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'xi-api-key': this.apiKey
          }
        }
      );

      return response.data.voice_id;
    } catch (error) {
      console.error('ElevenLabs clone hatasi:', error.response?.data || error.message);
      throw new Error('Ses klonlanamadi');
    }
  }

  // ALGILANAN DILE GÖRE SES
  async textToSpeech(text, voiceId, language = 'tr') {
    try {
      const defaultVoiceId = this.defaultVoices[language] || this.defaultVoices.tr;
      const finalVoiceId = voiceId || defaultVoiceId;
      
      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${finalVoiceId}`,
        {
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('ElevenLabs TTS hatasi:', error.response?.data || error.message);
      throw new Error('Ses olusturulamadi');
    }
  }

  async deleteVoice(voiceId) {
    try {
      await axios.delete(`${this.baseUrl}/voices/${voiceId}`, {
        headers: { 'xi-api-key': this.apiKey }
      });
      return true;
    } catch (error) {
      console.error('ElevenLabs silme hatasi:', error.response?.data || error.message);
      return false;
    }
  }
}

module.exports = new ElevenLabsService();
