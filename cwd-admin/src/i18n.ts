import { createI18n } from 'vue-i18n';
import zhCN from './locales/zh-CN.json';
import enUS from './locales/en-US.json';
import zhTW from './locales/zh-TW.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ru from './locales/ru.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import id from './locales/id.json';

const i18n = createI18n({
  legacy: false, // 使用 Composition API
  locale: localStorage.getItem('admin_language') || 'zh-CN', // 默认语言
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'zh-TW': zhTW,
    'es': es,
    'pt': pt,
    'fr': fr,
    'de': de,
    'ja': ja,
    'ko': ko,
    'ru': ru,
    'it': it,
    'nl': nl,
    'ar': ar,
    'hi': hi,
    'id': id,
  },
});

export default i18n;
