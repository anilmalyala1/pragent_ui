export const API_BASE = {
  prs: process.env.REACT_APP_API_HOST_PRS || '',
  review: process.env.REACT_APP_API_HOST_REVIEW || '',
  patch: process.env.REACT_APP_API_HOST_PATCH || '',
  chat: process.env.REACT_APP_API_HOST_CHAT || ''
};

export function apiUrl(key, path) {
  const base = API_BASE[key] || '';
  return `${base}${path}`;
}

export default API_BASE;
