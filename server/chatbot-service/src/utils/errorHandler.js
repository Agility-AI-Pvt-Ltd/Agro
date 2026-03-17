const logger = require("../../../shared/logger");

const handleExternalApiError = (error, logContext = "") => {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    logger.error(`[Chatbot API Timeout] ${logContext}`, { error: error.message });
    return {
      success: false,
      error: "ai_service_unavailable",
      message: "AI service is temporarily unavailable. Please try again."
    };
  }
  
  // Any other error from the external service
  logger.error(`[Chatbot API Error] ${logContext}`, { 
    error: error.message,
    status: error.response?.status,
    data: error.response?.data
  });
  
  return {
    success: false,
    error: "external_api_failed",
    message: "AI service is temporarily unavailable. Please try again."
  };
};

module.exports = { handleExternalApiError };
