/**
 * Auth bridge — breaks the circular dependency between api/api.ts and auth-store.ts.
 * api/api.ts imports from here (no store dependency).
 * auth-store.ts calls the setters here after the store is created.
 */

let _getToken: () => string | null = () => null;
let _logout: () => void = () => {};
let _refresh: () => Promise<string | null> = async () => null;

export const setTokenGetter = (fn: () => string | null) => {
  _getToken = fn;
};

export const setLogoutFn = (fn: () => void) => {
  _logout = fn;
};

export const setRefreshTokenFn = (fn: () => Promise<string | null>) => {
  _refresh = fn;
};

export const getAuthToken = (): string | null => _getToken();
export const authLogout = (): void => _logout();
export const refreshAuthToken = (): Promise<string | null> => _refresh();
