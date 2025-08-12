import { HeroSection } from '@/components';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Main container with proper spacing and responsive classes */}
      <main className="w-full">

        {/* Hero Section */}
        <HeroSection
          title="Share Your Travel Adventures on the Decentralized Web"
          subtitle="Join a vibrant community of travelers sharing stories, photos, and experiences on the Hive blockchain. Own your content, connect with fellow adventurers, and explore the world together."
          primaryCTA={{
            text: "Join the Community",
            href: "/signup",
            variant: "primary"
          }}
          secondaryCTA={{
            text: "Explore Stories",
            href: "/explore",
            variant: "secondary"
          }}
        />

        {/* Features Section Placeholder */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Features Section Placeholder
              </h2>
              <p className="text-lg text-gray-600">
                This will be replaced with the FeaturesSection component
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-orange-200 rounded-lg mx-auto mb-4"></div>
                <h3 className="font-semibold mb-2">Feature 1</h3>
                <p className="text-gray-600">Feature description</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-orange-200 rounded-lg mx-auto mb-4"></div>
                <h3 className="font-semibold mb-2">Feature 2</h3>
                <p className="text-gray-600">Feature description</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <div className="w-12 h-12 bg-orange-200 rounded-lg mx-auto mb-4"></div>
                <h3 className="font-semibold mb-2">Feature 3</h3>
                <p className="text-gray-600">Feature description</p>
              </div>
            </div>
          </div>
        </section>

        {/* Community Showcase Placeholder */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Community Showcase Placeholder
              </h2>
              <p className="text-lg text-gray-600">
                This will be replaced with the CommunityShowcase component
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="h-48 bg-gradient-to-br from-blue-200 to-green-200"></div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Sample Content 1</h3>
                  <p className="text-gray-600 text-sm">Content preview</p>
                </div>
              </div>
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="h-48 bg-gradient-to-br from-orange-200 to-red-200"></div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Sample Content 2</h3>
                  <p className="text-gray-600 text-sm">Content preview</p>
                </div>
              </div>
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200"></div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Sample Content 3</h3>
                  <p className="text-gray-600 text-sm">Content preview</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Web3 Benefits Placeholder */}
        <section className="py-16 sm:py-20 lg:py-24 bg-white px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Web3 Benefits Placeholder
              </h2>
              <p className="text-lg text-gray-600">
                This will be replaced with the Web3Benefits component
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="">
                <h3 className="text-xl font-semibold mb-4 text">Decentralized Benefits</h3>
                <ul className="space-y-3 text-gray-600">
                  <li>• Data ownership and control</li>
                  <li>• Censorship resistance</li>
                  <li>• Community governance</li>
                  <li>• Transparent operations</li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg p-8 text-center">
                <div className="w-24 h-24 bg-orange-200 rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Web3 illustration placeholder</p>
              </div>
            </div>
          </div>
        </section>

        {/* Travel Gallery Placeholder */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Travel Gallery Placeholder
              </h2>
              <p className="text-lg text-gray-600">
                This will be replaced with the TravelGallery component
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gradient-to-br from-slate-300 to-orange-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section Placeholder */}
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-amber-500 to-amber-500 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Call to Action Placeholder
            </h2>
            <p className="text-lg text-orange-100 mb-8">
              This will be replaced with the CallToActionSection component
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white text-orange-500 px-8 py-4 rounded-lg font-semibold">
                Join Community
              </div>
              <div className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold">
                Learn More
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
