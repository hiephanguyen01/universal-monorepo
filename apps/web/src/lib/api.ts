"use client";
import { ApiClient, type TokenStorage } from '@repo/api-client';
import type { AuthTokens } from '@repo/types';
class BrowserTokenStorage implements TokenStorage {
  async getAccessToken(){return localStorage.getItem('access_token')} async getRefreshToken(){return localStorage.getItem('refresh_token')}
  async setTokens(t:AuthTokens){localStorage.setItem('access_token',t.accessToken);localStorage.setItem('refresh_token',t.refreshToken)} async clear(){localStorage.removeItem('access_token');localStorage.removeItem('refresh_token')}
}
export const api=new ApiClient(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',new BrowserTokenStorage());
