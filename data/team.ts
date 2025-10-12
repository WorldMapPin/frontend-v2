export interface TeamMember {
  id: string;
  name: string;
  username: string;
  role: string;
  category: string[];
  image?: string;
}

// Base URL for Hive avatars
const HIVE_AVATAR_BASE_URL = 'https://images.hive.blog/u/';

// --- Row 1: Management & Leadership ---
export const row1Members: TeamMember[] = [
  {
    id: '1',
    name: 'Detlev',
    username: '@detlev',
    role: 'Project Owner, Management, Finance and Development',
    category: ['Management', 'Development'],
    image: `${HIVE_AVATAR_BASE_URL}detlev/avatar`
  },
  {
    id: '2',
    name: 'Liza Nomad Soul',
    username: '@lizanomadsoul',
    role: 'Founder, Management, Curation and Communication',
    category: ['Management', 'Curation', 'Community'],
    image: `${HIVE_AVATAR_BASE_URL}lizanomadsoul/avatar`
  },
  {
    id: '3',
    name: 'Asgarth',
    username: '@asgarth',
    role: 'Development Manager',
    category: ['Management', 'Development'],
    image: `${HIVE_AVATAR_BASE_URL}asgarth/avatar`
  }
];

// --- Row 2: Core Development ---
export const row2Members: TeamMember[] = [
  {
    id: '4',
    name: 'Arcange',
    username: '@arcange',
    role: 'DevOps',
    category: ['Development'],
    image: `${HIVE_AVATAR_BASE_URL}arcange/avatar`
  },
  {
    id: '5',
    name: 'MasterSwatch',
    username: '@masterswatch',
    role: 'Frontend Developer',
    category: ['Development'],
    image: `${HIVE_AVATAR_BASE_URL}masterswatch/avatar`
  },
  {
    id: '6',
    name: 'Abin Saji',
    username: '@abinsaji4',
    role: 'Frontend Developer',
    category: ['Development'],
    image: `${HIVE_AVATAR_BASE_URL}abinsaji4/avatar`
  }
];

// --- Row 3: Design & Testing ---
export const row3Members: TeamMember[] = [
  {
    id: '7',
    name: 'Hari Prasad',
    username: '@hariprasadd',
    role: 'UI Designer',
    category: ['Design', 'Development'],
    image: `${HIVE_AVATAR_BASE_URL}hariprasadd/avatar`
  },
  {
    id: '8',
    name: 'Louis88',
    username: '@louis88',
    role: 'Graphic Design, Testing & Communication',
    category: ['Design', 'Testing', 'Community'],
    image: `${HIVE_AVATAR_BASE_URL}louis88/avatar`
  },
  {
    id: '9',
    name: 'Sunsea',
    username: '@sunsea',
    role: 'Enduser Testing',
    category: ['Testing'],
    image: `${HIVE_AVATAR_BASE_URL}sunsea/avatar`
  }
];

// --- Row 4: Communication & Community ---
export const row4Members: TeamMember[] = [
  {
    id: '10',
    name: 'Rivalzzz',
    username: '@rivalzzz',
    role: 'Communication',
    category: ['Community'],
    image: `${HIVE_AVATAR_BASE_URL}rivalzzz/avatar`
  },
  {
    id: '11',
    name: 'Godfish',
    username: '@godfish',
    role: 'Community',
    category: ['Community'],
    image: `${HIVE_AVATAR_BASE_URL}godfish/avatar`
  },
  {
    id: '12',
    name: 'Nina Eats Here',
    username: '@ninaeatshere',
    role: 'Communication & Curation',
    category: ['Community', 'Curation'],
    image: `${HIVE_AVATAR_BASE_URL}ninaeatshere/avatar`
  }
];

// --- Row 5: Curation Team ---
export const row5Members: TeamMember[] = [
  {
    id: '13',
    name: 'Lauramica',
    username: '@lauramica',
    role: 'Curation',
    category: ['Curation'],
    image: `${HIVE_AVATAR_BASE_URL}lauramica/avatar`
  },
  {
    id: '14',
    name: 'YbanezKim26',
    username: '@ybanezkim26',
    role: 'Curation',
    category: ['Curation'],
    image: `${HIVE_AVATAR_BASE_URL}ybanezkim26/avatar`
  },
  {
    id: '15',
    name: 'Glecerio Berto',
    username: '@glecerioberto',
    role: 'Curation',
    category: ['Curation'],
    image: `${HIVE_AVATAR_BASE_URL}glecerioberto/avatar`
  }
];

export const teamMembers: TeamMember[] = [
  ...row1Members,
  ...row2Members,
  ...row3Members,
  ...row4Members,
  ...row5Members
];

export const categories = [
  'All',
  'Management',
  'Development',
  'Design',
  'Testing',
  'Curation',
  'Community'
];
