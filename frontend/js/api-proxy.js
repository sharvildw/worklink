(() => {
  const configuredBase = window.WORKLINK_API_BASE || localStorage.getItem("worklink_api_base") || "";
  const trimmedConfiguredBase = configuredBase.replace(/\/$/, "");
  const defaultDevPort = localStorage.getItem("worklink_api_port") || "5003";

  const detectBaseUrl = () => {
    if (trimmedConfiguredBase) {
      return trimmedConfiguredBase;
    }

    if (window.location.protocol === "file:") {
      return `http://localhost:${defaultDevPort}`;
    }

    const isLocalDevHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isLocalDevHost && window.location.port && window.location.port !== defaultDevPort) {
      return `${window.location.protocol}//${window.location.hostname}:${defaultDevPort}`;
    }

    return window.location.origin;
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
  window.buildApiUrl = buildApiUrl;

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
