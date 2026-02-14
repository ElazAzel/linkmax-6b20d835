import { useTranslation } from 'react-i18next';
import { List, ChevronRight } from 'lucide-react';

export function TableOfContents() {
  const { t } = useTranslation();

  const sections = [
    { id: 'link-in-bio', label: t('landing.toc.linkInBio', 'Что такое Link-in-Bio') },
    { id: 'for-whom', label: t('landing.toc.forWhom', 'Для кого') },
    { id: 'features', label: t('landing.toc.features', 'Возможности') },
    { id: 'use-cases', label: t('landing.toc.useCases', 'Примеры') },
    { id: 'pricing', label: t('landing.toc.pricing', 'Тарифы') },
    { id: 'faq', label: t('landing.toc.faq', 'FAQ') },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <nav 
      className="py-4 sm:py-6 px-5 sm:px-6 border-b border-border/30 bg-muted/10 backdrop-blur-sm sticky top-[72px] sm:top-[80px] z-40"
      aria-label={t('landing.toc.ariaLabel', 'Содержание страницы')}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 text-muted-foreground flex-shrink-0">
            <List className="h-4 w-4" />
            <span className="text-xs font-medium hidden sm:inline">{t('landing.toc.title', 'Содержание')}:</span>
          </div>
          <ul className="flex items-center gap-1 sm:gap-2">
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className="group flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors whitespace-nowrap"
                >
                  {section.label}
                  <ChevronRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
