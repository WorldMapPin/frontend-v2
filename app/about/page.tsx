import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - WorldMapPin",
  description: "Learn about WorldMapPin's mission to revolutionize travel through blockchain technology. Discover how we're building a decentralized platform for authentic travel stories.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1850px] mx-auto">
      {/* Hero Section */}
      <div className="bg-[linear-gradient(119.72deg,_#FFA97B_31.83%,_#FFC464_89.02%)] rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 text-center mb-4 sm:mb-6 md:mb-8 min-h-[400px] sm:min-h-[500px] md:min-h-[610px] flex flex-col justify-center border-[2px] border-[#5E210040]">
      <p className="font-lexend text-[#592102] text-xl md:text-lg mb-4">
  About
</p>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
          Revolutionizing Travel<br />
          Through <span className="text-[#8B4513]">Blockchain</span>
        </h1>
        <p className="font-lexend text-xl sm:text-2xl md:text-[30px] leading-[110%] tracking-[-0.03em] text-center text-[#592102] max-w-xs sm:max-w-xl md:max-w-2xl mx-auto font-normal">
          Join a vibrant community of travelers sharing authentic stories, photos, and experiences while owning your content on the decentralized web.
        </p>
      </div>

      {/* Our Story Section */}
      <div className="bg-[linear-gradient(92.88deg,_#FFE1D1_1.84%,_#F7DCAA_100%)] rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 mb-4 sm:mb-6 md:mb-8 min-h-[400px] sm:min-h-[500px] md:min-h-[610px] border-[2px] border-[#5E210040] flex items-center">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-24 items-center justify-items-center w-full">
          <div className="flex flex-col justify-center">
            <p className="font-lexend text-[#592102] text-xl md:text-lg mb-4">About</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6"><span className="text-[#592102]">Our</span> Story</h2>
            <p className="font-lexend text-lg sm:text-xl md:text-[28px] leading-[125%] tracking-[-0.03em] text-[#331B00] max-w-xs sm:max-w-xl md:max-w-none">
              WorldMapPin was born from a simple yet powerful idea: travelers should own and benefit from the content they create. Traditional travel platforms profit from user-generated content while creators receive little in return. We saw an opportunity to change this dynamic entirely.
            </p>
          </div>
          <div className="bg-white rounded-3xl w-[280px] h-[224px] sm:w-[320px] sm:h-[256px] md:w-[400px] md:h-[320px] shadow-[4px_8px_20px_0px_#00000026]"></div>
        </div>
      </div>

      {/* People Centric Section */}
      <div className="bg-[linear-gradient(119.72deg,_#FFDBC7_31.83%,_#FFEAC7_89.02%)] rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 mb-4 sm:mb-6 md:mb-8 min-h-[400px] sm:min-h-[500px] md:min-h-[610px] border-[2px] border-[#5E210040] flex items-center">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-24 items-center justify-items-center w-full">
          <div className="order-2 md:order-1 bg-white rounded-3xl w-[280px] h-[224px] sm:w-[320px] sm:h-[256px] md:w-[400px] md:h-[320px] shadow-[4px_8px_20px_0px_#00000026] flex items-center justify-center"></div>
          <div className="order-1 md:order-2 text-center md:text-right flex flex-col justify-center">
            <p className="font-lexend text-[#592102] text-xl md:text-lg mb-4">About</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6"><span className="text-[#592102]">People</span> Centric</h2>
            <p className="font-lexend text-lg sm:text-xl md:text-[28px] leading-[125%] tracking-[-0.03em] text-[#331B00] max-w-xs sm:max-w-xl md:max-w-none mx-auto md:ml-auto md:mr-0">
              Founded by passionate travelers and blockchain enthusiasts, WorldMapPin emerged as a solution to the centralized nature of today's travel sharing platforms. We believe that the stories, photos, and experiences shared by our community belong to the creators - not the platforms that host them.
            </p>
          </div>
        </div>
      </div>

      {/* Built on Hive Section */}
      <div className="bg-[linear-gradient(161.38deg,_#FFF8E0_12.6%,_#FFE6B8_87.4%)] rounded-3xl p-6 sm:p-8 md:p-12 lg:p-16 mb-4 sm:mb-6 md:mb-8 min-h-[400px] sm:min-h-[500px] md:min-h-[610px] border-[2px] border-[#5E210040] flex items-center">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-24 items-center justify-items-center w-full">
          <div className="flex flex-col justify-center">
            <p className="font-lexend text-[#592102] text-xl md:text-lg mb-4">About</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
              Built on <span className="text-[#592102]">Hive</span>
            </h2>
            <p className="font-lexend text-lg sm:text-xl md:text-[28px] leading-[125%] tracking-[-0.03em] text-[#331B00] max-w-xs sm:max-w-xl md:max-w-none">
              Built on the Hive Blockchain, WorldMapPin represents a new era of travel content sharing where authenticity is rewarded, creators maintain ownership, and community governance drives platform decisions. Every pin you place, every story you share, and every connection you make is permanently yours on the blockchain.
            </p>
          </div>
          <div className="bg-white rounded-3xl w-[280px] h-[224px] sm:w-[320px] sm:h-[256px] md:w-[400px] md:h-[320px] shadow-[4px_8px_20px_0px_#00000026]"></div>
        </div>
      </div>

      
    </div>
  );
};
