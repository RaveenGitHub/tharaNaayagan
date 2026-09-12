import type { APIRequestContext, APIResponse } from "@playwright/test";
import { getEnvironment, type EnvironmentName } from "../config/environments";

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: unknown;
  token?: string;
  timeout?: number;
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(
    private readonly request: APIRequestContext,
    envName: EnvironmentName = "dev",
  ) {
    const env = getEnvironment(envName);
    this.baseUrl = env.apiUrl || env.baseUrl;
  }

  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Request-ID": `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...(options?.headers || {}),
    };

    if (options?.token) {
      headers["Authorization"] = `Bearer ${options.token}`;
    }

    return headers;
  }

  private resolveUrl(endpoint: string): string {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }
    const cleanBase = this.baseUrl.replace(/\/+$/, "");
    const cleanEndpoint = endpoint.replace(/^\/+/, "");
    return `${cleanBase}/${cleanEndpoint}`;
  }

  async get(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    return this.request.get(this.resolveUrl(endpoint), {
      headers: this.buildHeaders(options),
      params: options?.params,
      timeout: options?.timeout || 15_000,
    });
  }

  async post(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    return this.request.post(this.resolveUrl(endpoint), {
      headers: this.buildHeaders(options),
      data: options?.data,
      params: options?.params,
      timeout: options?.timeout || 15_000,
    });
  }

  async put(endpoint: string, options?: RequestOptions): Promise<APIResponse> {
    return this.request.put(this.resolveUrl(endpoint), {
      headers: this.buildHeaders(options),
      data: options?.data,
      params: options?.params,
      timeout: options?.timeout || 15_000,
    });
  }

  async delete(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<APIResponse> {
    return this.request.delete(this.resolveUrl(endpoint), {
      headers: this.buildHeaders(options),
      data: options?.data,
      params: options?.params,
      timeout: options?.timeout || 15_000,
    });
  }
}
