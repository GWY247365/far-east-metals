import translations from '../data/translations.json';

type Lang = 'en' | 'cn';

function getLang(): Lang {
  return (localStorage.getItem('lang') as Lang) || 'en';
}

function setLang(lang: Lang) {
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang === 'cn' ? 'zh-CN' : 'en';
  applyTranslations(lang);
  updateToggle(lang);
}

function updateToggle(lang: Lang) {
  document.querySelectorAll('.lang-label').forEach(el => {
    const elLang = (el as HTMLElement).dataset.lang;
    el.classList.toggle('active', elLang === lang);
  });
}

function resolve(obj: any, path: string): string | undefined {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

function applyTranslations(lang: Lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = (el as HTMLElement).dataset.i18n!;
    const entry = resolve(translations, key);
    if (entry && typeof entry === 'object' && (entry as any)[lang]) {
      const text = (entry as any)[lang];
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if ((el as HTMLInputElement).placeholder) {
          (el as HTMLInputElement).placeholder = text;
        } else {
          (el as HTMLInputElement).value = text;
        }
      } else {
        el.textContent = text;
      }
    }
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const lang = getLang();
  updateToggle(lang);
  if (lang !== 'en') {
    applyTranslations(lang);
  }

  document.getElementById('langToggle')?.addEventListener('click', () => {
    const current = getLang();
    setLang(current === 'en' ? 'cn' : 'en');
  });
});
