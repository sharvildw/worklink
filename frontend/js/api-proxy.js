(() => {
  const DEFAULT_API_BASE = "https://worklink-rtpb.onrender.com";
  const LOCAL_HOSTS = ["localhost", "127.0.0.1"];
  const configuredBase = window.WORKLINK_API_BASE || localStorage.getItem("worklink_api_base") || "";

  const normalizeConfiguredBase = (value) => {
    const trimmedValue = (value || "").trim().replace(/\/$/, "");
    if (!trimmedValue) {
      return "";
    }

    try {
      const parsedUrl = new URL(trimmedValue);
      const isLocalFrontend = window.location.protocol === "file:" || LOCAL_HOSTS.includes(window.location.hostname);
      const isLocalApi = LOCAL_HOSTS.includes(parsedUrl.hostname);

      if (isLocalApi && !isLocalFrontend) {
        console.warn(`[WorkLink API] Ignoring local API override on ${window.location.origin}: ${trimmedValue}`);
        localStorage.removeItem("worklink_api_base");
        localStorage.removeItem("worklink_api_port");
        return "";
      }

      return parsedUrl.origin;
    } catch (_error) {
      console.warn(`[WorkLink API] Ignoring invalid API base override: ${trimmedValue}`);
      return "";
    }
  };

  const normalizedConfiguredBase = normalizeConfiguredBase(configuredBase);

  const detectBaseUrl = () => {
    if (normalizedConfiguredBase) {
      return normalizedConfiguredBase;
    }

    return DEFAULT_API_BASE;
  };

  const apiBaseUrl = detectBaseUrl();
  const originalFetch = window.fetch.bind(window);

  const buildApiUrl = (path) => {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${apiBaseUrl}${normalizedPath}`;
  };

  window.WORKLINK_API_BASE = apiBaseUrl;
  window.WORKLINK_DEFAULT_API_BASE = DEFAULT_API_BASE;
  window.buildApiUrl = buildApiUrl;
  console.info(`[WorkLink API] Base URL resolved to ${apiBaseUrl}`);

  window.fetch = (input, init) => {
    if (typeof input === "string") {
      if (input.startsWith("/api/") || input === "/api") {
        return originalFetch(buildApiUrl(input), init);
      }

      return originalFetch(input, init);
    }

    if (input instanceof Request) {
      const requestUrl = input.url || "";
      const currentOrigin = window.location.origin;
      const isRelativeApiRequest = requestUrl.startsWith(`${currentOrigin}/api/`) || requestUrl === `${currentOrigin}/api`;

      if (isRelativeApiRequest) {
        const rewrittenUrl = requestUrl.replace(currentOrigin, apiBaseUrl);
        return originalFetch(new Request(rewrittenUrl, input), init);
      }
    }

    return originalFetch(input, init);
  };
})();
