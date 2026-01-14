import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About - WorldMapPin",
  description: "Learn about WorldMapPin's mission to revolutionize travel through blockchain technology. Discover how we're building a decentralized platform for authentic travel stories.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Hero Section - Styled like MyCountries header */}
        <div className="rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-8 relative" style={{ background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)' }}>
          <Image
            src="/globe.svg"
            alt="Globe"
            width={300}
            height={300}
            className="absolute opacity-10 top-1/2 left-0 -translate-y-1/2 -translate-x-1/4"
          />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-5 rounded-full blur-3xl -ml-32 -mb-32"></div>
          
          <div className="relative z-10 px-6 sm:px-12 py-10 sm:py-16 text-center">
            <h1 className="font-lexend text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white tracking-tight">
              Revolutionizing Travel<br />
              <span className="opacity-90">Through Blockchain</span>
            </h1>
            <p className="font-lexend text-base sm:text-lg md:text-xl max-w-3xl mx-auto text-white/90 font-medium leading-relaxed">
              Join a vibrant community of travelers sharing authentic stories, photos, and experiences while owning your content on the decentralized web.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 sm:space-y-8 font-lexend">
          {/* Our Story Section */}
          <section className="rounded-3xl p-6 sm:p-10 shadow-lg border transition-all duration-300 hover:shadow-xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-orange-500 font-bold tracking-wider uppercase text-xs sm:text-sm mb-2 block">Our Story</span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Born from a <span className="text-orange-500">Simple Idea</span>
                </h2>
                <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  WorldMapPin was born from a simple yet powerful idea: travelers should own and benefit from the content they create. Traditional travel platforms profit from user-generated content while creators receive little in return. We saw an opportunity to change this dynamic entirely.
                </p>
              </div>
              <div className="relative h-[250px] w-full rounded-2xl overflow-hidden flex items-center justify-center bg-orange-50/50" style={{ border: '1px solid var(--border-subtle)' }}>
                 <Image
                    src="/images/worldmappin-logo.png"
                    alt="WorldMapPin Logo"
                    width={150}
                    height={150}
                    className="object-contain opacity-90 drop-shadow-lg"
                 />
                 <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent"></div>
              </div>
            </div>
          </section>

          {/* People Centric Section */}
          <section className="rounded-3xl p-6 sm:p-10 shadow-lg border transition-all duration-300 hover:shadow-xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="order-2 md:order-1 relative h-[250px] w-full rounded-2xl overflow-hidden flex items-center justify-center bg-blue-50/50" style={{ border: '1px solid var(--border-subtle)' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-40 h-40 bg-blue-100 rounded-full opacity-50 blur-2xl"></div>
                   <div className="w-24 h-24 bg-orange-100 rounded-full opacity-50 blur-xl -ml-12"></div>
                </div>
                <Image
                  src="/globe.svg"
                  alt="Globe"
                  width={180}
                  height={180}
                  className="relative z-10 opacity-80"
                />
              </div>
              <div className="order-1 md:order-2">
                <span className="text-blue-500 font-bold tracking-wider uppercase text-xs sm:text-sm mb-2 block">Community First</span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  People <span className="text-blue-500">Centric</span>
                </h2>
                <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Founded by passionate travelers and blockchain enthusiasts, WorldMapPin emerged as a solution to the centralized nature of today&apos;s travel sharing platforms. We believe that the stories, photos, and experiences shared by our community belong to the creators - not the platforms that host them.
                </p>
              </div>
            </div>
          </section>

          {/* Built on Hive Section */}
          <section className="rounded-3xl p-6 sm:p-10 shadow-lg border transition-all duration-300 hover:shadow-xl" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-subtle)' }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-red-500 font-bold tracking-wider uppercase text-xs sm:text-sm mb-2 block">Technology</span>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Built on <span className="text-red-500">Hive</span>
                </h2>
                <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Built on the Hive Blockchain, WorldMapPin represents a new era of travel content sharing where authenticity is rewarded, creators maintain ownership, and community governance drives platform decisions. Every pin you place is permanently yours on the blockchain.
                </p>
              </div>
              <div className="relative h-[250px] w-full rounded-2xl overflow-hidden flex items-center justify-center bg-red-50/50" style={{ border: '1px solid var(--border-subtle)' }}>
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-100/50 to-transparent"></div>
                 <div className="text-3xl font-bold text-red-500/20 tracking-widest absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12">
                   BLOCKCHAIN
                 </div>
                 <Image
                    src="/images/logo_light.svg"
                    alt="Logo Icon"
                    width={100}
                    height={100}
                    className="relative z-10 drop-shadow-md"
                 />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
