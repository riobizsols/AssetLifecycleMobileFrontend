import { API_CONFIG, API_ENDPOINTS, getApiHeaders } from "../config/api";

const fetchWithFallback = async (path, options = {}) => {
  const servers = [API_CONFIG.BASE_URL, ...API_CONFIG.FALLBACK_URLS];
  let lastError;

  for (const baseUrl of servers) {
    try {
      const headers = await getApiHeaders();
      const { method = "GET", body, headers: extraHeaders, ...restOptions } =
        options;

      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { ...headers, ...extraHeaders },
        body,
        ...restOptions,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Request failed with status ${response.status}: ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.warn(
        `[assetUsageService] Request failed for ${baseUrl}${path}:`,
        error?.message || error,
      );
      lastError = error;
    }
  }

  throw lastError || new Error("Unable to complete request");
};

export const assetUsageService = {
  async getAssetsForUsageRecording() {
    const data = await fetchWithFallback(
      API_ENDPOINTS.GET_ASSET_USAGE_ASSETS(),
    );

    return {
      assetTypes: data?.assetTypes || [],
      assets: data?.assets || [],
    };
  },

  async getAssetUsageHistory(assetId) {
    if (!assetId) {
      return [];
    }

    const data = await fetchWithFallback(
      API_ENDPOINTS.GET_ASSET_USAGE_HISTORY(assetId),
    );

    return data?.history || [];
  },

  async recordUsage({ assetId, usageCounter }) {
    const payload = {
      asset_id: assetId,
      usage_counter: usageCounter,
    };

    const data = await fetchWithFallback(API_ENDPOINTS.RECORD_ASSET_USAGE(), {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return data;
  },
};

