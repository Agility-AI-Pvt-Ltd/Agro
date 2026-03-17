const axios = require('axios');

// Prevent appending /api if it's already there
const rawBaseURL = process.env.AI_API_BASE_URL || '';
const aiBaseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL}/api`;

const apiClient = axios.create({
  baseURL: aiBaseURL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

module.exports = apiClient;
