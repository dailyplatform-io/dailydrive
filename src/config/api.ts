export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://daily-drive-chgke0afepcrhwck.italynorth-01.azurewebsites.net';

export const apiUrl = (path: string) => `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
