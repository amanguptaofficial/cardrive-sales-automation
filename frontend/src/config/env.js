export const env = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
};
