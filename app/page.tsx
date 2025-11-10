export const metadata = {
  title: 'WorldMapPin — Share Your Travel Adventures',
  description: 'Join a vibrant community of travelers sharing stories, photos and experiences on the Hive Blockchain',
};

import GradientText from '../components/home/GradientText';
import FeatureCard from '../components/home/FeatureCard';
import ShowcaseCard from '../components/home/ShowcaseCard';
import BenefitItem from '../components/home/BenefitItem';

export default function Home() {
  const features = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
      title: 'Interactive Travel Map',
      description: 'Pin your adventures on an interactive global map and visualize your journey across continents.',
      iconGradient: 'linear-gradient(135deg, #54F7F4 0%, #73FFBB 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(84, 247, 244, 0.1) 0%, rgba(115, 255, 187, 0.15) 50%, rgba(255, 255, 255, 0.9) 100%)',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      ),
      title: 'Rich Media Stories',
      description: 'Share stunning photos, videos, and detailed narratives of your travel experiences with the community.',
      iconGradient: 'linear-gradient(135deg, #ED6D28 0%, #FF8C42 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(237, 109, 40, 0.1) 0%, rgba(255, 140, 66, 0.15) 50%, rgba(255, 255, 255, 0.9) 100%)',
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      ),
      title: 'Blockchain Verified',
      description: 'Your content is permanently stored on Hive blockchain, ensuring authenticity and ownership.',
      iconGradient: 'linear-gradient(135deg, #C654F7 0%, #FF737A 100%)',
      cardGradient: 'linear-gradient(135deg, rgba(198, 84, 247, 0.1) 0%, rgba(255, 115, 154, 0.15) 50%, rgba(255, 255, 255, 0.9) 100%)',
    },
  ];

  const showcases = [
    {
      gradient: 'linear-gradient(104.41deg, rgba(84, 247, 244, 0.6) 7.45%, rgba(115, 255, 187, 0.6) 100%)',
      bgColor: '#DCFFFE',
      borderColor: '#00CF6B1A',
      title: <GradientText gradient="teal">Discover Hidden Gems</GradientText>,
      description: 'Explore off-the-beaten-path destinations shared by fellow travelers',
      image: 'https://images.hive.blog/p/FUkUE5bzkAZT3HzV5tJDiU2ik81PCd4JCyhWnRcDN8XJsVFY3UNB8DCSkoSHcgh1WxsTjmg2qHxCnu41yPReEMEv9PfY7rjPxTa9K9zF8jRzyvVLtkxLcPdP9j7SR3kuNNzqQzvsXLCJHxwNAVtLTcXPMVK5RpsWHuDG?format=match&mode=fit',
    },
    {
      gradient: 'linear-gradient(104.41deg, rgba(237, 109, 40, 0.6) 7.45%, rgba(255, 115, 154, 0.6) 100%)',
      bgColor: '#FFE2D299',
      borderColor: '#FB89401A',
      title: <GradientText>Connect with Travelers</GradientText>,
      description: 'Build meaningful connections with a global community of adventurers',
      image: 'https://images.ecency.com/DQmdn6qowQPQQGZwhz23JgdcywY2oKub1B7fuPNQe34w71K/dsc09964.jpg',
    },
    {
      gradient: 'linear-gradient(104.41deg, rgba(198, 84, 247, 0.6) 7.45%, rgba(255, 115, 154, 0.6) 100%)',
      bgColor: '#F9ECFF',
      borderColor: '#C654F71A',
      title: <GradientText gradient="purple">Earn Crypto Rewards</GradientText>,
      description: 'Get rewarded in cryptocurrency for sharing your travel content',
      image: 'https://images.hive.blog/p/FUkUE5bzkAZT3HzV5tJDiU2ik81PCd4JCyhWnRcDN8XJsVFY3UNB8DCSkoSHcgh1WxsUt3WT1F5gb3ARPaNoNZNvqPHGtuLtaGmexBQmFV3eKemGRDEFKZgYUnZFin8da8UyPeiVeCJ5aadmZwQBkFJfpH35zZqT42Cn?format=match&mode=fit',
    },
  ];

  const benefits = [
    {
      title: 'True Content Ownership',
      description: 'You own your content forever. No platform can delete or censor your travel memories.',
    },
    {
      title: 'Earn While You Share',
      description: 'Receive cryptocurrency rewards when community members upvote your travel stories.',
    },
    {
      title: 'Decentralized Discovery',
      description: 'Explore unique travel posts pinned by users worldwide, all verified on the blockchain for authenticity and transparency.',
    },
  ];

  return (
    <main className="w-full min-h-screen bg-white">
      {/* HERO SECTION */}
      <section 
        className="w-full min-h-[520px] sm:min-h-[560px] md:min-h-[600px] lg:min-h-[690px] relative overflow-hidden flex items-center justify-center" 
        style={{ background: 'linear-gradient(150.44deg, #ED6D28 20.69%, #FFA600 81.91%)' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
          <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-lexend" style={{ lineHeight: 1.15 }}>
              <GradientText gradient="hero">
                Share your Travel
                <br />
                Adventures on the
                <br />
                Decentralized Web
              </GradientText>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/95 mb-6 max-w-2xl mx-auto font-lexend leading-snug">
              <span className="block">Join a vibrant community of travelers sharing</span>
              <span className="block">stories, photos and experiences on the Hive</span>
              <span className="block">Blockchain.</span>
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 justify-center items-center w-full max-w-xs mx-auto">
              <a
                href="/signup"
                className="inline-flex items-center justify-center text-white font-semibold px-8 py-3 rounded-lg text-base transition-all duration-300 font-lexend w-full max-w-xs hover:shadow-2xl hover:scale-105 active:scale-95"
                style={{ background: '#A74F1A' }}
              >
                Join the Community
              </a>
              <a
                href="/explore"
                className="inline-flex items-center justify-center bg-transparent text-white font-semibold px-8 py-3 rounded-lg text-base border-2 border-white transition-all duration-300 font-lexend w-full max-w-xs hover:bg-white hover:text-orange-500 hover:shadow-2xl hover:scale-105 active:scale-95"
              >
                Explore Stories
              </a>
            </div>
          </div>
        </div>
        {/* Fade-away gradient */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{ 
            background: 'linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.3) 40%, rgba(255, 255, 255, 0.6) 65%, rgba(255, 255, 255, 0.85) 85%, rgba(255, 255, 255, 1) 100%)'
          }}
        />
      </section>

      {/* MAP PREVIEW SECTION */}
      <section className="w-full bg-white py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#592102] font-lexend">
                Explore the World
              </h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
                className="text-[#592102] w-6 h-6 md:w-8 md:h-8 animate-bounce"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
            </div>
            <div className="relative w-full aspect-[4/3] md:aspect-[21/9] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden border-2 border-gray-300 shadow-2xl hover:shadow-3xl transition-shadow duration-300">
              <img
                src="/images/map-preview.png"
                alt="Interactive world map showing travel pins from community members"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="w-full bg-gradient-to-b from-white to-orange-50/30 py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-3 font-lexend">
              <GradientText>Powerful Features for Travelers</GradientText>
            </h2>
            <p className="text-lg sm:text-xl font-lexend max-w-3xl mx-auto" style={{ color: '#6F5B50' }}>
              Everything you need to document and share your adventures with the world
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY SHOWCASE SECTION */}
      <section className="w-full bg-white py-12 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-3 font-lexend">
              <GradientText>Join Our Community</GradientText>
            </h2>
            <p className="text-lg sm:text-xl font-lexend max-w-3xl mx-auto" style={{ color: '#6F5B50' }}>
              See what makes WorldMapPin special for travelers around the globe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {showcases.map((showcase, index) => (
              <ShowcaseCard key={index} {...showcase} />
            ))}
          </div>
        </div>
      </section>

      {/* WEB3 BENEFITS SECTION */}
      <section 
        className="w-full py-12 lg:py-20 relative overflow-hidden" 
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,233,221,0.6) 14.42%, rgba(255,165,116,0.6) 73.56%, rgba(255,255,255,0.6) 99.52%)'}}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold font-lexend mb-3" style={{ color: '#592102' }}>
              Why Choose Web3?
            </h2>
            <p className="text-lg sm:text-xl font-lexend max-w-3xl mx-auto" style={{ color: '#6F5B50' }}>
              Experience the future of travel content creation with blockchain technology
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {benefits.map((benefit, index) => (
              <BenefitItem key={index} {...benefit} />
            ))}
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 lg:pr-16 opacity-20 pointer-events-none">
          <span className="text-[300px] lg:text-[500px] font-bold text-orange-600 font-lexend">3</span>
        </div>
      </section>
    </main>
  );
}
