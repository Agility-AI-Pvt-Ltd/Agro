const apiClient = require('../utils/apiClient');
const { handleExternalApiError } = require('../utils/errorHandler');
const logger = require('../../../shared/logger');

class AdvisoryService {
  /**
   * Send custom natural language query to external API
   */
  async sendCustomQuery(user_query, sowing_date, latitude, longitude, attempts = 0) {
    console.log("[Chatbot Request Payload]", {
      type: "custom",
      user_query,
      sowing_date,
      latitude,
      longitude
    });
    try {
      const response = await apiClient.post('/advisory', {
        user_query,
        sowing_date,
        latitude,
        longitude
      });
      console.log("[Chatbot API Raw Response]", response.data);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error("[Chatbot API Timeout]", error);
      } else {
        console.error("[Chatbot API Error]", error.message);
      }
      if (attempts < 1 && (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.response?.status >= 500)) {
        logger.warn(`[Chatbot] API timeout/error. Retrying custom query...`);
        return this.sendCustomQuery(user_query, sowing_date, latitude, longitude, attempts + 1);
      }
      throw handleExternalApiError(error, `Custom Query '${user_query}'`);
    }
  }

  /**
   * Send predefined choice to external API
   */
  async sendPredefinedQuery(choice, sowing_date, latitude, longitude, attempts = 0) {
    console.log("[Chatbot Request Payload]", {
      type: "predefined",
      choice,
      sowing_date,
      latitude,
      longitude
    });
    try {
      const response = await apiClient.post('/advisory/predefined', {
        choice,
        sowing_date,
        latitude,
        longitude
      });
      console.log("[Chatbot API Raw Response]", response.data);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error("[Chatbot API Timeout]", error);
      } else {
        console.error("[Chatbot API Error]", error.message);
      }
      if (attempts < 1 && (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.response?.status >= 500)) {
        logger.warn(`[Chatbot] API timeout/error. Retrying predefined query...`);
        return this.sendPredefinedQuery(choice, sowing_date, latitude, longitude, attempts + 1);
      }
      throw handleExternalApiError(error, `Predefined Query Choice '${choice}'`);
    }
  }
}

module.exports = new AdvisoryService();
