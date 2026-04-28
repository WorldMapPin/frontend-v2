export interface TeamMember {
  name: string;
  username: string;
  role: string;
  category: string[];
  image?: string;
}

// Base URL for Hive avatars
const HIVE_AVATAR_BASE_URL = "https://images.ecency.com/u";
export const PEAKD_PROFILE_BASE_URL = "https://peakd.com/@";

export const teamMembers: TeamMember[] = [
  {
    name: "Detlev",
    username: "@detlev",
    role: "Project Owner, Management, Finance and Development",
    category: ["Management", "Development"],
    image: `${HIVE_AVATAR_BASE_URL}/detlev/avatar`,
  },
  {
    name: "Liza Nomad Soul",
    username: "@lizanomadsoul",
    role: "Founder, Management, Curation and Communication",
    category: ["Management", "Curation", "Community"],
    image: `${HIVE_AVATAR_BASE_URL}/lizanomadsoul/avatar`,
  },
  {
    name: "Sergio",
    username: "@asgarth",
    role: "Development Manager",
    category: ["Management", "Development"],
    image: `${HIVE_AVATAR_BASE_URL}/asgarth/avatar`,
  },
  {
    name: "Arcange",
    username: "@arcange",
    role: "DevOps",
    category: ["Development"],
    image: `${HIVE_AVATAR_BASE_URL}/arcange/avatar`,
  },
  {
    name: "MasterSwatch",
    username: "@masterswatch",
    role: "Frontend Developer",
    category: ["Development"],
    image: `${HIVE_AVATAR_BASE_URL}/masterswatch/avatar`,
  },
  {
    name: "Abin Saji",
    username: "@abinsaji4",
    role: "Frontend Developer",
    category: ["Development"],
    image: `${HIVE_AVATAR_BASE_URL}/abinsaji4/avatar`,
  },
  {
    name: "Hari Prasad",
    username: "@hariprasadd",
    role: "UI Designer and Frontend Developer",
    category: ["Design", "Development"],
    image: `${HIVE_AVATAR_BASE_URL}/hariprasadd/avatar`,
  },
  {
    name: "Louis88",
    username: "@louis88",
    role: "Graphic Design, Testing & Communication",
    category: ["Design", "Testing", "Community"],
    image: `${HIVE_AVATAR_BASE_URL}/louis88/avatar`,
  },
  {
    name: "Sunsea",
    username: "@sunsea",
    role: "End User Testing",
    category: ["Testing"],
    image: `${HIVE_AVATAR_BASE_URL}/sunsea/avatar`,
  },
  {
    name: "Rivalzzz",
    username: "@rivalzzz",
    role: "Communication",
    category: ["Community"],
    image: `${HIVE_AVATAR_BASE_URL}/rivalzzz/avatar`,
  },
  {
    name: "Godfish",
    username: "@godfish",
    role: "Community",
    category: ["Community"],
    image: `${HIVE_AVATAR_BASE_URL}/godfish/avatar`,
  },
  {
    name: "Nina Eats Here",
    username: "@ninaeatshere",
    role: "Communication & Curation",
    category: ["Community", "Curation"],
    image: `${HIVE_AVATAR_BASE_URL}/ninaeatshere/avatar`,
  },
  {
    name: "Lauramica",
    username: "@lauramica",
    role: "Curation",
    category: ["Curation"],
    image: `${HIVE_AVATAR_BASE_URL}/lauramica/avatar`,
  },
  {
    name: "YbanezKim26",
    username: "@ybanezkim26",
    role: "Curation",
    category: ["Curation"],
    image: `${HIVE_AVATAR_BASE_URL}/ybanezkim26/avatar`,
  },
  {
    name: "Glecerio Berto",
    username: "@glecerioberto",
    role: "Curation",
    category: ["Curation"],
    image: `${HIVE_AVATAR_BASE_URL}/glecerioberto/avatar`,
  },
  {
    name: "Gabriela",
    username: "@gabrielatravels",
    role: "Curation",
    category: ["Curation"],
    image: `${HIVE_AVATAR_BASE_URL}/gabrielatravels/avatar`,
  },
];

const memberCategories = Array.from(
  new Set(teamMembers.flatMap((member) => member.category)),
);

export const categories = ["All", ...memberCategories];
