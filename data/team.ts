export interface TeamMember {
  id: string;
  name: string;
  username: string;
  role: string;
  category: string[];
  image?: string;
}

// --- Row 1: Management & Leadership ---
export const row1Members: TeamMember[] = [
  {
    id: '1',
    name: 'Detlev',
    username: '@detlev',
    role: 'Project Owner, Management, Finance and Development',
    category: ['Management', 'Development'],
    image: '/images/team/detlev.png'
  },
  {
    id: '2',
    name: 'Liza Nomad Soul',
    username: '@lizanomadsoul',
    role: 'Founder, Management, Curation and Communication',
    category: ['Management', 'Curation', 'Community'],
    image: '/images/team/liz.png'
  },
  {
    id: '3',
    name: 'Asgarth',
    username: '@asgarth',
    role: 'Development Manager',
    category: ['Management', 'Development'],
    image: '/images/team/asgarth.png'
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
    image: '/images/team/arcange.png'
  },
  {
    id: '5',
    name: 'MasterSwatch',
    username: '@masterswatch',
    role: 'Frontend Developer',
    category: ['Development'],
    image: '/images/team/masterswatch.png'
  },
  {
    id: '6',
    name: 'Abin Saji',
    username: '@abinsaji4',
    role: 'Frontend Developer',
    category: ['Development'],
    image: '/images/team/abin.png'
  }
];

// --- Row 3: Design & Testing ---
export const row3Members: TeamMember[] = [
  {
    id: '7',
    name: 'Hari Prasad',
    username: '@purelyeerie',
    role: 'UI Designer',
    category: ['Design', 'Development'],
    image: '/images/team/hari.png'
  },
  {
    id: '8',
    name: 'Louis88',
    username: '@louis88',
    role: 'Graphic Design, Testing & Communication',
    category: ['Design', 'Testing', 'Community'],
    image: '/images/team/louis.png'
  },
  {
    id: '9',
    name: 'Sunsea',
    username: '@sunsea',
    role: 'Enduser Testing',
    category: ['Testing'],
    image: '/images/team/sunsea.jpeg'
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
    image: '/images/team/rivalzzz.png'
  },
  {
    id: '11',
    name: 'Godfish',
    username: '@godfish',
    role: 'Community',
    category: ['Community'],
    image: '/images/team/godfish.png'
  },
  {
    id: '12',
    name: 'Nina Eats Here',
    username: '@ninaeatshere',
    role: 'Communication & Curation',
    category: ['Community', 'Curation'],
    image: '/images/team/nina.png'
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
    image: '/images/team/laura.jpeg'
  },
  {
    id: '14',
    name: 'YbanezKim26',
    username: '@ybanezkim26',
    role: 'Curation',
    category: ['Curation'],
    image: '/images/team/kim.jpeg'
  },
  {
    id: '15',
    name: 'Glecerio Berto',
    username: '@glecerioberto',
    role: 'Curation',
    category: ['Curation'],
    image: '/images/team/gb.jpeg'
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
