export const SITE = {
  name: 'Leonardo Foo',
  fullName: 'Leonardo Foo Haw Yang',
  zhName: '胡皓雍',
  description:
    'Leonardo Foo Haw Yang — M.S. student at NTU, AI safety and practical evaluation, organizer of NTUAIS. Taipei.',
} as const;

export type NavKey = 'home' | 'writing' | 'projects' | 'cv';

export const NAV: { key: NavKey; label: string; href: string }[] = [
  { key: 'writing', label: 'writing', href: '/writing/' },
  { key: 'projects', label: 'projects', href: '/projects/' },
  { key: 'cv', label: 'cv', href: '/cv/' },
];

export const LINKS: { label: string; href: string }[] = [
  { label: 'github', href: 'https://github.com/leonardofhy' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/leonardo-fhy/' },
  { label: 'rss', href: '/rss.xml' },
];
