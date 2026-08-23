export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://api-juicios-evaluativos-jp.adsoproject.dev'),
}
