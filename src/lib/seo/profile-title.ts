/**
 * Builds search-friendly title/description for public author pages from
 * real page content: name + profession + city + main action.
 * Example: "Айгуль — мастер маникюра в Алматы | Запись онлайн"
 */
interface ProfileSeoInput {
  name?: string | null;
  profession?: string | null;
  city?: string | null;
  bio?: string | null;
  blocks?: Array<{ type?: string } | null | undefined>;
}

const PLACEHOLDER_NAMES = new Set(['your name', 'ваше имя', 'имя', 'name', 'profile', 'untitled']);

export function isPlaceholderName(name?: string | null): boolean {
  return !name || PLACEHOLDER_NAMES.has(name.trim().toLowerCase());
}

function hasBlock(blocks: ProfileSeoInput['blocks'], re: RegExp) {
  return (blocks || []).some((b) => !!b?.type && re.test(b.type));
}

export function buildProfileSeoTitle(input: ProfileSeoInput): string | null {
  const name = input.name?.trim();
  if (isPlaceholderName(name)) return null;
  const profession = input.profession?.trim();
  const city = input.city?.trim();
  let title = name!;
  if (profession) title += ` — ${profession.charAt(0).toLowerCase()}${profession.slice(1)}`;
  if (city) title += ` в ${city}`;
  const action = hasBlock(input.blocks, /booking/)
    ? 'Запись онлайн'
    : hasBlock(input.blocks, /pricing|product|catalog/)
      ? 'Цены и услуги'
      : hasBlock(input.blocks, /messenger|form/)
        ? 'Контакты'
        : '';
  if (action && title.length + action.length < 62) title += ` | ${action}`;
  return title.slice(0, 70);
}

export function buildProfileSeoDescription(input: ProfileSeoInput): string | null {
  const name = input.name?.trim();
  if (isPlaceholderName(name)) return null;
  const parts: string[] = [];
  const who = [input.profession?.trim(), input.city?.trim() ? `в ${input.city.trim()}` : ''].filter(Boolean).join(' ');
  if (who) parts.push(`${who.charAt(0).toUpperCase()}${who.slice(1)}.`);
  if (input.bio) parts.push(input.bio.trim().replace(/\s+/g, ' ').slice(0, 110));
  const extras: string[] = [];
  if (hasBlock(input.blocks, /pricing|product|catalog/)) extras.push('цены');
  if (hasBlock(input.blocks, /gallery|carousel|portfolio/)) extras.push('работы');
  if (hasBlock(input.blocks, /review|testimonial/)) extras.push('отзывы');
  if (hasBlock(input.blocks, /booking/)) extras.push('онлайн-запись');
  if (extras.length) parts.push(`${extras.join(', ').replace(/^./, (c) => c.toUpperCase())} на странице ${name}.`);
  const text = parts.join(' ').trim();
  return text ? text.slice(0, 158) : null;
}
