/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import CryptoJS from "crypto-js";
import { v4 as uuid } from "uuid";
import {
  getAccessToken,
  getHmacSecret,
  setAccessToken,
  setHmacSecret,
} from "../stores/auth.store";

const API_BASE_URL = import.meta.env.VITE_API_URL as string || "http://localhost:5000";
const BOOTSTRAP_AUTH_ROUTES = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
]);
const SESSION_HMAC_HEADER = "x-session-hmac";

type ApiEnvelope<T> = {
  status?: "success" | "error";
  data?: T;
  message?: string;
  details?: unknown;
};

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

const getCookie = (name: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

const encryptPayload = (payload: unknown, secret: string) => {
  return CryptoJS.AES.encrypt(JSON.stringify(payload), secret).toString();
};

const decryptPayload = (encrypted: string, secret: string) => {
  const bytes = CryptoJS.AES.decrypt(encrypted, secret);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

const generateSignature = ({
  timestamp,
  nonce,
  encryptedPayload,
  secret,
}: {
  timestamp: string;
  nonce: string;
  encryptedPayload: string;
  secret: string;
}) => {
  const message = `${timestamp}:${nonce}:${encryptedPayload}`;
  return CryptoJS.HmacSHA256(message, secret).toString();
};

const isBootstrapAuthRoute = (url?: string) =>
  typeof url === "string" && BOOTSTRAP_AUTH_ROUTES.has(url);

const syncSessionHmac = (response: AxiosResponse<any>) => {
  const sessionHmac = response.headers[SESSION_HMAC_HEADER] as string | undefined;
  if (sessionHmac) {
    setHmacSecret(sessionHmac);
  }
};

const tryDecryptResponse = (response: AxiosResponse<any>) => {
  const encryptedData = response.data?.data;
  const signature = response.headers["x-signature"] as string | undefined;
  const timestamp = response.data?.timestamp as string | undefined;
  const nonce = response.data?.nonce as string | undefined;

  if (typeof encryptedData !== "string" || !signature || !timestamp || !nonce) {
    return response;
  }

  const hmacSecret = getHmacSecret();
  if (!hmacSecret) {
    throw new Error("Missing HMAC secret for encrypted response");
  }

  const expected = generateSignature({
    timestamp,
    nonce,
    encryptedPayload: encryptedData,
    secret: hmacSecret,
  });
  if (expected !== signature) {
    throw new Error("Response tampered with");
  }

  response.data = decryptPayload(encryptedData, hmacSecret);
  return response;
};

const attachSecurityHeaders = (config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || new AxiosHeaders();
    config.headers.Authorization = `Bearer ${token}`;
  }

  const csrfToken = getCookie("csrfToken");
  if (csrfToken) {
    config.headers = config.headers || new AxiosHeaders();
    config.headers["x-csrf-token"] = csrfToken;
  }

  if (isBootstrapAuthRoute(config.url)) {
    return config;
  }

  const hmacSecret = getHmacSecret();
  if (!hmacSecret) {
    return config;
  }

  const timestamp = Date.now().toString();
  const nonce = uuid();
  const hasBody = config.data !== undefined;
  const encryptedPayload = hasBody ? encryptPayload(config.data, hmacSecret) : "";
  const signature = generateSignature({
    timestamp,
    nonce,
    encryptedPayload,
    secret: hmacSecret,
  });
  config.headers = config.headers || new AxiosHeaders();
  if (hasBody) {
    config.data = { data: encryptedPayload, timestamp, nonce };
  }
  config.headers["x-signature"] = signature;
  config.headers["x-timestamp"] = timestamp;
  config.headers["x-nonce"] = nonce;
  return config;
};

httpClient.interceptors.request.use((config) => attachSecurityHeaders(config));

httpClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    syncSessionHmac(response);
    return tryDecryptResponse(response);
  },
  (error: AxiosError) => {
    if (error.response) {
      syncSessionHmac(error.response);
      try {
        tryDecryptResponse(error.response);
      } catch (decryptionError) {
        return Promise.reject(decryptionError);
      }
    }

    if (error.response?.status === 401) {
      setHmacSecret(null);
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
    return Promise.reject(error);
  },
);

const unwrapResponse = <T>(response: AxiosResponse<ApiEnvelope<T> | T>) => {
  const payload = response.data as any;
  return payload?.status === "success" && payload?.data !== undefined
    ? payload.data
    : payload;
};

const secureApi = {
  get: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await httpClient.get<ApiEnvelope<T> | T>(url, config);
    return unwrapResponse(response) as T;
  },
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await httpClient.post<ApiEnvelope<T> | T>(
      url,
      data,
      config,
    );
    return unwrapResponse(response) as T;
  },
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => {
    const response = await httpClient.put<ApiEnvelope<T> | T>(
      url,
      data,
      config,
    );
    return unwrapResponse(response) as T;
  },
  patch: async <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => {
    const response = await httpClient.patch<ApiEnvelope<T> | T>(
      url,
      data,
      config,
    );
    return unwrapResponse(response) as T;
  },
  delete: async <T>(url: string, config?: AxiosRequestConfig) => {
    const response = await httpClient.delete<ApiEnvelope<T> | T>(url, config);
    return unwrapResponse(response) as T;
  },
  setAccessToken,
  setHmacSecret,
};

export { setAccessToken, setHmacSecret, secureApi };
export default secureApi;
