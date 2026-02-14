import { useEffect } from 'react';

interface StructuredDataProps {
  id: string;
  data: object;
}

export function StructuredData({ id, data }: StructuredDataProps) {
  useEffect(() => {
    let script = document.querySelector(`script#${id}`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);

    return () => {
      script?.remove();
    };
  }, [id, data]);

  return null;
}
