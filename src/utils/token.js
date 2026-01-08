export const TOKEN_KEY = 'parking_token'
export const REFRESH_TOKEN_KEY = 'parking_refresh_token'
export const USER_INFO_KEY = 'parking_user_info'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function setRefreshToken(refreshToken) {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function removeRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getUserInfo() {
  const info = localStorage.getItem(USER_INFO_KEY)
  return info ? JSON.parse(info) : null
}

export function setUserInfo(info) {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
}

export function clearAll() {
  removeToken()
  removeRefreshToken()
  removeUserInfo()
}
