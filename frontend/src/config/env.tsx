const VITE_API_URL = import.meta.env.VITE_API_URL;

// モック使用可否
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export { VITE_API_URL, USE_MOCK };
