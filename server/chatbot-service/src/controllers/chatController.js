const advisoryService = require('../services/advisoryService');
const prisma = require('../../../shared/prisma');
const { logActivity } = require('../../../shared/activity');
const logger = require('../../../shared/logger');

// Strict date validation: yyyy-mm-dd format and valid actual date
const isValidDate = (dateString) => {
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString || !dateString.match(regEx)) return false;
  
  const d = new Date(dateString);
  const dNum = d.getTime();
  if(!dNum && dNum !== 0) return false;
  return d.toISOString().slice(0,10) === dateString;
};

// Ensure context is complete and update DB if retry payloads provided them
const ensureContextAndProcess = async (userId, customParams, actionName, endpoint) => {
  // DB query optimization (Fetch once per request)
  const userWithData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      crops: {
        where: { status: 'active' },
        orderBy: { created_at: 'desc' },
        take: 1
      }
    }
  });

  const profile = userWithData?.profile;
  const crop = userWithData?.crops?.[0];

  console.log("[DB Data Used]", {
    sowing_date: crop ? crop.sowing_date.toISOString().split('T')[0] : null,
    latitude: profile?.location_lat,
    longitude: profile?.location_lng
  });

  // Define explicitly if user wants to change context (Edge Case 1)
  const queryLower = (customParams.user_query || customParams.choice || '').toLowerCase();
  const forceUpdateReq = queryLower.includes('change my location') || 
                         queryLower.includes('update my location') || 
                         queryLower.includes('update my sowing date') || 
                         queryLower.includes('change my sowing date');

  // Strict: If force update requested, ignore DB values and expect payload. If payload missing:
  if (forceUpdateReq && (!customParams.latitude || !customParams.longitude || !customParams.sowing_date)) {
     return { 
       isError: true, 
       status: 422, 
       data: { success: false, error: "requires_location_and_date", message: "Please provide your new location and sowing date to update." } 
     };
  }

  // Data extraction logic prioritizing incoming payload (used in retry flow) over existing DB values
  let latitude = customParams.latitude !== undefined ? customParams.latitude : profile?.location_lat;
  let longitude = customParams.longitude !== undefined ? customParams.longitude : profile?.location_lng;
  let sowing_date = customParams.sowing_date || (crop ? crop.sowing_date.toISOString().split('T')[0] : null);

  // Validate incoming partial overrides
  if (customParams.latitude !== undefined && (typeof customParams.latitude !== 'number' || customParams.latitude < -90 || customParams.latitude > 90)) {
     return { isError: true, status: 400, data: { success: false, error: "invalid_latitude", message: "Latitude must be between -90 and 90." }};
  }
  if (customParams.longitude !== undefined && (typeof customParams.longitude !== 'number' || customParams.longitude < -180 || customParams.longitude > 180)) {
     return { isError: true, status: 400, data: { success: false, error: "invalid_longitude", message: "Longitude must be between -180 and 180." }};
  }
  if (customParams.sowing_date && !isValidDate(customParams.sowing_date)) {
     return { isError: true, status: 400, data: { success: false, error: "invalid_sowing_date", message: "Sowing date must be in yyyy-mm-dd format and a valid date." }};
  }

  // Final Missing Data Check (IF ANY ONE IS MISSING -> prompt)
  if (!sowing_date && (latitude !== null && longitude !== null)) {
    console.log("[Chatbot Flow Decision]", "Requesting user for missing data");
    return { 
      isError: true, 
      status: 422, 
      data: { success: false, error: "no_active_crop", message: "We couldn't find an active crop. Please provide your sowing date and location." }
    };
  }

  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined || !sowing_date) {
    console.log("[Chatbot Flow Decision]", "Requesting user for missing data");
    return { 
      isError: true, 
      status: 422, 
      data: { success: false, error: "requires_location_and_date", message: "Please provide your sowing date and current location to continue." }
    };
  }

  // Valid context achieved: Update Database explicitly ONLY if user provided params
  let dbUpdated = false;
  if (customParams.latitude !== undefined || customParams.longitude !== undefined || customParams.sowing_date) {
    try {
      if (profile && (customParams.latitude !== undefined || customParams.longitude !== undefined)) {
        await prisma.farmerProfile.update({
          where: { user_id: userId },
          data: { location_lat: latitude, location_lng: longitude }
        });
        dbUpdated = true;
      }
      
      if (customParams.sowing_date && crop) {
        await prisma.crop.update({
          where: { id: crop.id },
          data: { sowing_date: new Date(sowing_date) }
        });
        dbUpdated = true;
      } else if (customParams.sowing_date && !crop) {
         await prisma.crop.create({
           data: {
             user_id: userId,
             crop_type: "Unknown", 
             sowing_date: new Date(sowing_date),
             status: "active"
           }
         });
         dbUpdated = true;
      }
      
      if (dbUpdated) {
         logger.info(`[Chatbot] DB updated for user ${userId} with new context`);
      }
    } catch (err) {
      logger.error("[Chatbot] DB Update failed on retry", { error: err.message });
    }
  }

  // Bonus Logs
  if (!dbUpdated && crop && profile && !forceUpdateReq) {
     console.log("[Chatbot Flow Decision]", "Using DB data");
     logger.info(`[Chatbot] Using existing DB data for user ${userId}`);
  }

  // Processing specific Action
  let apiResponse;
  try {
    if (actionName === 'custom_chat') {
      apiResponse = await advisoryService.sendCustomQuery(customParams.user_query, sowing_date, latitude, longitude);
      
      // Save AI Query to DB
      await prisma.advisoryQuery.create({
        data: {
          user_id: userId,
          issue_description: customParams.user_query,
          ai_response: apiResponse
        }
      });
      await logActivity(userId, "chatbot_custom_message", endpoint, { user_query: customParams.user_query });
    } else if (actionName === 'predefined_chat') {
      apiResponse = await advisoryService.sendPredefinedQuery(customParams.choice, sowing_date, latitude, longitude);
      await logActivity(userId, "chatbot_predefined_message", endpoint, { choice: customParams.choice });
    }
    
    // Transform external response to standard format
    return {
      isError: false,
      status: 200,
      data: {
        success: true,
        message: apiResponse.advisory,
        crop_stage: apiResponse.crop_stage,
        weather: {
          current: apiResponse.weather_current,
          forecast: apiResponse.weather_forecast
        }
      }
    };
  } catch (err) {
    // Expected to be structured from handleExternalApiError
    return {
      isError: true,
      status: 503,
      data: err || { success: false, error: "external_api_failed", message: "AI service is temporarily unavailable. Please try again." }
    };
  }
};

const handleCustomChat = async (req, res) => {
  const { userId } = req.user;
  const { user_query, latitude, longitude, sowing_date } = req.body;

  if (latitude || longitude || sowing_date) {
    console.log("[User Provided Data]", req.body);
  }

  if (!user_query) {
    return res.status(400).json({ success: false, message: "user_query is required" });
  }

  const result = await ensureContextAndProcess(userId, { user_query, latitude, longitude, sowing_date }, 'custom_chat', '/chatbot/custom');
  return res.status(result.status).json(result.data);
};

const handlePredefinedChat = async (req, res) => {
  const { userId } = req.user;
  const { choice, latitude, longitude, sowing_date } = req.body;

  if (latitude || longitude || sowing_date) {
    console.log("[User Provided Data]", req.body);
  }

  if (!choice) {
    return res.status(400).json({ success: false, message: "choice is required" });
  }

  const result = await ensureContextAndProcess(userId, { choice, latitude, longitude, sowing_date }, 'predefined_chat', '/chatbot/predefined');
  return res.status(result.status).json(result.data);
};

module.exports = {
  handleCustomChat,
  handlePredefinedChat
};
