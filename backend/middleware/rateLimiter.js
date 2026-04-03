const requests = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 200;

const rateLimiter = (req, res, next) => {
  const key = req.ip || "unknown";
  const current = requests.get(key) || {
    count: 0,
    startTime: Date.now()
  };

  if (Date.now() - current.startTime > WINDOW_MS) {
    current.count = 0;
    current.startTime = Date.now();
  }

  current.count += 1;
  requests.set(key, current);

  if (current.count > MAX_REQUESTS) {
    return res.status(429).json({
      message: "Too many requests. Please try again later."
    });
  }

  return next();
};

module.exports = rateLimiter;
