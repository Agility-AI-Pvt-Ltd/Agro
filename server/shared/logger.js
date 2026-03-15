/**
 * Simple structured logger
 * Uses console methods with ISO timestamps and log levels.
 * Can be swapped for Winston/Pino in the future.
 */

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = levels[process.env.LOG_LEVEL] ?? levels.info;

function format(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(Object.keys(meta).length ? { meta } : {}),
  });
}

const logger = {
  debug: (message, meta = {}) => {
    if (currentLevel <= levels.debug) {
      console.debug(format("debug", message, meta));
    }
  },
  info: (message, meta = {}) => {
    if (currentLevel <= levels.info) {
      console.info(format("info", message, meta));
    }
  },
  warn: (message, meta = {}) => {
    if (currentLevel <= levels.warn) {
      console.warn(format("warn", message, meta));
    }
  },
  error: (message, meta = {}) => {
    if (currentLevel <= levels.error) {
      console.error(format("error", message, meta));
    }
  },
};

module.exports = logger;
