export interface CvEntry {
  when: string;
  org: string;
  role: string;
  notes: string[];
}

export const education: CvEntry[] = [
  {
    when: 'Sep 2023 – present',
    org: 'National Taiwan University',
    role: 'M.S. in Communication Engineering',
    notes: ['focus: deep learning · computer vision', 'research: ai safety · practical eval'],
  },
  {
    when: 'Sep 2019 – Jun 2023',
    org: 'National Taiwan University',
    role: 'B.S. in Electrical Engineering',
    notes: [],
  },
];

export const experience: CvEntry[] = [
  {
    when: '2024 – present',
    org: 'NTUAIS (NTU AI Safety)',
    role: 'Organizer',
    notes: [
      'organize discussions, speaker sessions, student-led activities',
      'connect researchers + students for practical safety insights',
    ],
  },
];

export const skills: [string, string[]][] = [
  ['languages', ['python', 'c++', 'javascript', 'go']],
  ['ai/ml', ['pytorch', 'tensorflow', 'opencv', 'huggingface', 'safe-ai-eval']],
  ['web', ['hugo', 'astro', 'react', 'node.js', 'gh-actions']],
  ['tools', ['docker', 'git', 'linux', 'aws']],
];
