import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { buildMetaDescription, escapeHtml, extractLocationFromBlocks } from './seo-helpers.ts';

Deno.test('escapeHtml escapes reserved characters', () => {
  assertEquals(escapeHtml('<script>"x"</script>'), '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
});

Deno.test('buildMetaDescription trims and truncates text', () => {
  const description = buildMetaDescription(['   Это длинное описание страницы, которое нужно сократить до корректной длины.   ']);
  assertStringIncludes(description, 'Это длинное описание страницы');
});

Deno.test('extractLocationFromBlocks returns first location-like value', () => {
  const location = extractLocationFromBlocks([
    { content: { locationValue: 'Алматы' } },
    { content: { address: 'Astana' } },
  ]);
  assertEquals(location, 'Алматы');
});
