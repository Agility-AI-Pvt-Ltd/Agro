import api from './api';

export const chatbotService = {
  /**
   * Send custom natural language message to bot
   * @param {string} user_query 
   * @param {object} context (optional) { latitude, longitude, sowing_date }
   */
  async sendCustomMessage(user_query, context = {}) {
    const payload = { user_query, ...context };
    const response = await api.post('/chatbot/custom', payload);
    return response.data;
  },

  /**
   * Send predefined choice to bot
   * @param {string} choice 
   * @param {object} context (optional) { latitude, longitude, sowing_date }
   */
  async sendPredefinedMessage(choice, context = {}) {
    const payload = { choice, ...context };
    const response = await api.post('/chatbot/predefined', payload);
    return response.data;
  }
};
