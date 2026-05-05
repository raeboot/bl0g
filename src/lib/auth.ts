const KEY = "bl0g:token";
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY);
}
export function setToken(t: string) {
  localStorage.setItem(KEY, t);
}
export function clearToken() {
  localStorage.removeItem(KEY);
}
