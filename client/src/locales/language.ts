import Cookies from 'js-cookie';

export function getInitialLanguage(): string {
  const cookieLanguage = Cookies.get('lang');
  if (cookieLanguage) {
    return cookieLanguage;
  }
  const storedLanguage = localStorage.getItem('lang');
  if (!storedLanguage) {
    return 'es';
  }
  try {
    const parsedLanguage: string = JSON.parse(storedLanguage);
    return typeof parsedLanguage === 'string' && parsedLanguage ? parsedLanguage : 'es';
  } catch {
    return storedLanguage;
  }
}
