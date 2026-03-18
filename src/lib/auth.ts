import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ROLE_KEY = "user_role";

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY);
}

export function getUserRole(): string | undefined {
  return Cookies.get(USER_ROLE_KEY);
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  role?: string,
): void {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, { expires: 1 }); // 1 day
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, { expires: 7 }); // 7 days
  if (role) {
    Cookies.set(USER_ROLE_KEY, role, { expires: 7 });
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:login"));
  }
}

export function removeTokens(): void {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
  Cookies.remove(USER_ROLE_KEY);
}

export function isLoggedIn(): boolean {
  return !!getAccessToken();
}
