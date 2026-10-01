export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession extends AuthTokens {
  user: UserDto;
}

export interface ApiSuccess<T> { success: true; data: T }
export interface ApiFailure { success: false; error: { code: string; message: string; details: unknown | null } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
