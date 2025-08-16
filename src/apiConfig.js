export const API_BASE = {
  prs: "http://localhost:8000" || '',
  review: process.env.REACT_APP_API_HOST_REVIEW || '',
  patch: process.env.REACT_APP_API_HOST_PATCH || '',
  chat: process.env.REACT_APP_API_HOST_CHAT || ''
};

export function apiUrl(key, path) {
  const base = API_BASE[key] || '';
  return `${base}${path}`;
}

export default API_BASE;


//process.env.REACT_APP_API_HOST_PRS