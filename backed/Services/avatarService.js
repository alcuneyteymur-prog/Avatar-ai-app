const axios = require('axios');

class AvatarService {
  constructor() {
    this.apiKey = process.env.RPM_API_KEY;
    this.baseUrl = 'https://api.readyplayer.me/v2';
  }

  async createAvatarFromPhoto(photoUrl) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/avatars`,
        {
          bodyType: 'fullbody',
          gender: 'neutral',
          photoUrl: photoUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        avatarId: response.data.data.id,
        avatarUrl: response.data.data.url,
        status: response.data.data.status
      };
    } catch (error) {
      console.error('RPM avatar olusturma hatasi:', error.response?.data || error.message);
      throw new Error('Avatar olusturulamadi');
    }
  }

  async getAvatar(avatarId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/avatars/${avatarId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.data;
    } catch (error) {
      console.error('RPM avatar getirme hatasi:', error.response?.data || error.message);
      throw new Error('Avatar bilgisi alinamadi');
    }
  }

  getDefaultAvatarUrl() {
    return 'https://models.readyplayer.me/6460d95f2e8d5d5f0f8f8f8f.glb';
  }
}

module.exports = new AvatarService();
