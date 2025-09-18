import type { Metadata } from "next";


type Status = "complete" | "active" | "planned";

type RoadmapItem = {
  title: string;
  description: string;
  status: Status;
};

type RoadmapPhase = {
  quarter: string;
  headline: string;
  summary: string;
  highlight: string;
  items: RoadmapItem[];
};

const statusStyles: Record<Status, string> = {
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  active: "border-sky-200 bg-sky-50 text-sky-700",
  planned: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusLabels: Record<Status, string> = {
  complete: "Completed",
  active: "In progress",
  planned: "Planned",
};

const roadmapPhases: RoadmapPhase[] = [
  {
    quarter: "Q4 2023",
    headline: "Ideation & Community Discovery",
    summary:
      "Validated the concept with early explorers, defined the social map experience, and secured our founding contributors.",
    highlight: "500+ early sign-ups joined the waitlist within the first six weeks.",
    items: [
      {
        title: "Community listening tours",
        description: "Interviewed travel storytellers and Web3 creators to map pain points and must-have features.",
        status: "complete",
      },
      {
        title: "Experience blueprint",
        description: "Sketched the end-to-end user journey from pinning a memory to sharing it on-chain.",
        status: "complete",
      },
      {
        title: "Founding cohort kickoff",
        description: "Opened a private Discord hub and established contributor guidelines.",
        status: "complete",
      },
    ],
  },
  {
    quarter: "Q1 2024",
    headline: "Foundation Launch",
    summary:
      "Assembled the core product pillars: immersive map browsing, contributor profiles, and Hive-powered publishing.",
    highlight: "Shipped the interactive map MVP and onboarded the first 25 storytellers.",
    items: [
      {
        title: "Interactive world map MVP",
        description: "Delivered a performant map with clustering, location filters, and responsive design.",
        status: "complete",
      },
      {
        title: "Profile & badge system",
        description: "Created contributor showcases with badge tiers and shareable public links.",
        status: "complete",
      },
      {
        title: "Publishing pipeline",
        description: "Implemented Hive blockchain posting with automatic asset back-up.",
        status: "active",
      },
    ],
  },
  {
    quarter: "Q2 2024",
    headline: "Creator Tools & Discovery",
    summary:
      "Focus on storytelling polish, collaborative curation, and smarter discovery across the globe.",
    highlight: "Rolling out guided story templates and AI-assisted tagging for richer posts.",
    items: [
      {
        title: "Story studio upgrade",
        description: "Introduce multimedia layouts with inline video, galleries, and ambient soundscapes.",
        status: "active",
      },
      {
        title: "Collaborative collections",
        description: "Enable members to co-curate itineraries and themed routes.",
        status: "active",
      },
      {
        title: "Signals & discovery",
        description: "Launch geofenced alerts, trending destinations, and seasonal highlights.",
        status: "planned",
      },
    ],
  },
  {
    quarter: "Q3 2024",
    headline: "Community Co-Creation",
    summary:
      "Put governance in the hands of explorers with voting, staking rewards, and local chapters.",
    highlight: "Beta test contribution rewards and launch the first DAO-aligned expeditions.",
    items: [
      {
        title: "Contributor reputation graph",
        description: "Visualize trust signals through on-chain badges, reviews, and verifications.",
        status: "planned",
      },
      {
        title: "Chapter playbooks",
        description: "Provide templates and resources for city captains to host meetups and quests.",
        status: "planned",
      },
      {
        title: "Governance pilot",
        description: "Run the first votes on feature priorities and curated expeditions.",
        status: "planned",
      },
    ],
  },
  {
    quarter: "Q4 2024",
    headline: "Open Ecosystem",
    summary:
      "Expand the platform through APIs, partner integrations, and cross-project collaborations.",
    highlight: "Welcome ecosystem partners to build extensions on top of the WorldMapPin map engine.",
    items: [
      {
        title: "Creator monetization options",
        description: "Offer tipping, premium drops, and collab marketplaces powered by Hive.",
        status: "planned",
      },
      {
        title: "Partner API",
        description: "Expose map, story, and reputation data for third-party tools and experiences.",
        status: "planned",
      },
      {
        title: "Immersive travel quests",
        description: "Launch narrative-driven quests with AR unlocks and real-world rewards.",
        status: "planned",
      },
    ],
  },
];

const strategicThemes = [
  {
    title: "Creator-first storytelling",
    description:
      "Tools that make it effortless to craft immersive travel memories with multimedia depth and on-chain ownership.",
    status: "active" as Status,
  },
  {
    title: "Community trust signals",
    description:
      "Transparent reputation systems so explorers can rely on authentic voices and verified experiences.",
    status: "planned" as Status,
  },
  {
    title: "Open ecosystem",
    description:
      "APIs and partner hooks that invite other builders to extend the map and remix our data sets.",
    status: "planned" as Status,
  },
];

export const metadata: Metadata = {
  title: "Roadmap | WorldMapPin",
  description:
    "Explore the WorldMapPin product roadmap and see how we are building a community-driven travel storytelling platform.",
};

export default function RoadmapPage() {
  return (
    <div className="bg-slate-950">
      <section className="relative overflow-hidden px-4 pt-24 pb-20 sm:px-6 sm:pt-28 sm:pb-24 lg:px-8">
        <div className="absolute inset-0">
          <div className="absolute -top-36 right-0 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="absolute bottom-0 left-[-4rem] h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center text-white">
          <p className="mb-4 inline-flex items-center rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/80">
            The journey ahead
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Mapping the future of community-powered travel stories
          </h1>
          <p className="mt-6 text-base text-white/70 sm:text-lg">
            We are building WorldMapPin in the open. This living roadmap highlights the milestones that bring explorers, storytellers, and builders together around a shared map of unforgettable journeys.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Roadmap milestones
            </h2>
            <p className="mt-3 text-base text-slate-600 sm:text-lg">
              Each phase blends product, community, and ecosystem workstreams. We update this timeline as deliverables evolve.
            </p>
          </div>
          <div className="relative border-l border-slate-200/80 pl-6 sm:pl-8">
            {roadmapPhases.map((phase, index) => (
              <article key={phase.quarter} className="pb-12 last:pb-0">
                <div className="absolute -left-3 mt-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-amber-500 text-xs font-semibold text-white shadow-lg shadow-amber-500/30">
                  {index + 1}
                </div>
                <div className="flex flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:p-8">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
                    <span className="inline-flex w-fit items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                      {phase.quarter}
                    </span>
                    <p className="text-sm font-medium text-amber-600">
                      {phase.highlight}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                      {phase.headline}
                    </h3>
                    <p className="mt-3 text-sm text-slate-600 sm:text-base">
                      {phase.summary}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {phase.items.map((item) => (
                      <div
                        key={item.title}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-semibold text-slate-900">
                            {item.title}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles[item.status]}`}
                          >
                            {statusLabels[item.status]}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Strategic themes guiding the build
            </h2>
            <p className="mt-3 text-base text-white/70 sm:text-lg">
              These themes anchor each milestone so every launch moves us closer to a resilient, co-created ecosystem.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {strategicThemes.map((theme) => (
              <div
                key={theme.title}
                className="flex h-full flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/80">
                    {statusLabels[theme.status]}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-white">
                    {theme.title}
                  </h3>
                  <p className="mt-4 text-sm text-white/70">
                    {theme.description}
                  </p>
                </div>
                <div className="mt-6 h-px bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-8 text-white shadow-xl sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Help shape the next chapter
              </h2>
              <p className="mt-3 text-base text-white/80 sm:text-lg">
                We welcome collaborators, storytellers, and builders. Drop in with feedback, propose ideas, or join a pilot crew.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-60">
              <a
                href="mailto:team@worldmappin.xyz"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-amber-600 shadow-sm transition hover:opacity-90"
              >
                Introduce yourself
              </a>
              <a
                href="/team"
                className="inline-flex items-center justify-center rounded-full border border-white/60 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Meet the team
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
