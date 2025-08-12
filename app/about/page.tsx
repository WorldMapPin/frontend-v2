import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About - WorldMapPin",
  description: "Learn about WorldMapPin's mission to create a decentralized travel community where adventurers share stories, connect with fellow travelers, and explore the world together on the Hive blockchain.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              About WorldMapPin
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed">
              Discover the story behind WorldMapPin and our vision for creating a decentralized travel community that empowers adventurers worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
            </div>

            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="text-xl leading-relaxed mb-6">
                At WorldMapPin, we believe that travel stories have the power to inspire, connect, and transform lives. Our mission is to create a decentralized platform where every traveler can share their unique adventures, discover hidden gems through authentic experiences, and build meaningful connections with fellow explorers around the globe.
              </p>

              <p className="text-lg leading-relaxed mb-6">
                We're committed to empowering travelers by giving them complete ownership of their content and data through blockchain technology. By leveraging the Hive blockchain, we ensure that your travel memories, stories, and connections remain truly yours, free from the constraints of traditional centralized platforms.
              </p>

              <p className="text-lg leading-relaxed">
                Our platform fosters a vibrant community where authenticity thrives, diverse perspectives are celebrated, and the spirit of adventure brings people together across cultures and continents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Vision
              </h2>
              <div className="w-24 h-1 bg-amber-500 mx-auto mb-8"></div>
            </div>

            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="text-xl leading-relaxed mb-6">
                We envision a world where travel experiences are shared freely, authentically, and without barriers. WorldMapPin aims to become the leading decentralized travel community, where millions of adventurers contribute to a global tapestry of stories, insights, and connections.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Global Community</h3>
                  <p className="text-gray-600">
                    Building bridges between cultures through shared travel experiences, fostering understanding and friendship across borders.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Decentralized Future</h3>
                  <p className="text-gray-600">
                    Leading the transition to Web3 travel platforms where users maintain control over their data and content.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Authentic Stories</h3>
                  <p className="text-gray-600">
                    Promoting genuine travel experiences over commercialized content, helping travelers discover real adventures.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Sustainable Travel</h3>
                  <p className="text-gray-600">
                    Encouraging responsible tourism practices that benefit local communities and preserve destinations for future generations.
                  </p>
                </div>
              </div>

              <p className="text-lg leading-relaxed text-center">
                Together, we're not just sharing travel stories – we're building the future of how the world explores, connects, and grows through shared adventures.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}