import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@repo/schemas";
import type {
  AuthSession,
  AuthTokens,
  PaginatedResult,
  UserDto,
} from "@repo/types";

export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  setTokens(tokens: AuthTokens): Promise<void>;
  clear(): Promise<void>;
}

export class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  retry?: boolean;
};

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenStorage: TokenStorage,
  ) {}

  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");

    if (options.auth !== false) {
      const accessToken = await this.tokenStorage.getAccessToken();

      if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
      }
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (
      response.status === 401 &&
      options.auth !== false &&
      options.retry !== false
    ) {
      const refreshed = await this.refresh();

      if (refreshed) {
        return this.request<T>(path, {
          ...options,
          retry: false,
        });
      }
    }

    const payload = (await response.json().catch(() => null)) as any;

    if (!response.ok) {
      throw new ApiClientError(
        response.status,
        payload?.error?.code ?? "HTTP_ERROR",
        payload?.error?.message ?? "Request failed",
      );
    }

    return payload?.data as T;
  }

  private async refresh(): Promise<boolean> {
    const refreshToken = await this.tokenStorage.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    try {
      const tokens = await this.request<AuthTokens>("/auth/refresh", {
        method: "POST",
        auth: false,
        retry: false,
        body: JSON.stringify({
          refreshToken,
        }),
      });

      await this.tokenStorage.setTokens(tokens);

      return true;
    } catch {
      await this.tokenStorage.clear();

      return false;
    }
  }

  readonly auth = {
    register: async (input: RegisterInput) => {
      const session = await this.request<AuthSession>("/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify(input),
      });

      await this.tokenStorage.setTokens(session);

      return session;
    },

    login: async (input: LoginInput) => {
      const session = await this.request<AuthSession>("/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify(input),
      });

      await this.tokenStorage.setTokens(session);

      return session;
    },

    logout: async () => {
      const refreshToken = await this.tokenStorage.getRefreshToken();

      if (refreshToken) {
        await this.request<null>("/auth/logout", {
          method: "POST",
          auth: false,
          body: JSON.stringify({
            refreshToken,
          }),
        });
      }

      await this.tokenStorage.clear();
    },
  };

  readonly users = {
    list: (
      params: {
        page?: number;
        pageSize?: number;
      } = {},
    ) => {
      const searchParams = new URLSearchParams();

      if (params.page) {
        searchParams.set("page", String(params.page));
      }

      if (params.pageSize) {
        searchParams.set("pageSize", String(params.pageSize));
      }

      const query = searchParams.toString();

      return this.request<PaginatedResult<UserDto>>(
        `/users${query ? `?${query}` : ""}`,
      );
    },

    me: () => this.request<UserDto>("/users/me"),

    updateMe: (input: UpdateProfileInput) =>
      this.request<UserDto>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),

    updateById: (userId: string, input: UpdateProfileInput) =>
      this.request<UserDto>(`/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",

        body: JSON.stringify(input),
      }),
  };
}
