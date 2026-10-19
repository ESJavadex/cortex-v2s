import { getInitialLanguage } from '~/locales/language';
import { atomWithLocalStorage } from './utils';

const lang = atomWithLocalStorage('lang', getInitialLanguage());

export default { lang };
