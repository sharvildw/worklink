const buildPagination = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1
});

const normalizeJobStatus = (status) => {
  if (!status) {
    return status;
  }

  const value = String(status).trim().toLowerCase();

  if (value === "in-progress") {
    return "hired";
  }

  return value;
};

const sanitizeSort = (value, allowed, fallback) => {
  if (!value || !allowed[value]) {
    return allowed[fallback];
  }

  return allowed[value];
};

module.exports = {
  buildPagination,
  normalizeJobStatus,
  sanitizeSort
};
