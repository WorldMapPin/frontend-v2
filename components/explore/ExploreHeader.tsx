interface ExploreHeaderProps {
  postCount?: number;
  totalCount?: number;
}

export default function ExploreHeader({ postCount, totalCount }: ExploreHeaderProps) {
  return (
    <div className="mx-auto px-2 sm:px-4 lg:px-8 pt-2 sm:pt-4" style={{ maxWidth: '1344px' }}>
      <div className="rounded-lg sm:rounded-xl shadow-lg m-2 sm:m-4 relative overflow-hidden" style={{ background: 'linear-gradient(92.88deg, #ED6D28 1.84%, #FFA600 100%)' }}>
        
        <img 
          src="/globe.svg" 
          alt="Globe" 
          className="absolute opacity-10 hidden sm:block"
          style={{ 
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '80px',
            height: '80px',
            zIndex: 1
          }}
        />
        <img 
          src="/globe.svg" 
          alt="Globe" 
          className="absolute opacity-10 sm:hidden"
          style={{ 
            left: '0.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '60px',
            height: '60px',
            zIndex: 1
          }}
        />
        
       
        <div 
          className="absolute hidden sm:flex flex-col items-center justify-center"
          style={{ 
            right: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '80px',
            height: '80px',
            backgroundColor: '#0000001A',
            borderRadius: '8px',
            zIndex: 1
          }}
        >
          {postCount !== undefined && totalCount !== undefined && totalCount > 0 && (
            <>
              <div className="text-white font-bold text-xl sm:text-2xl lg:text-3xl" style={{ fontFamily: 'var(--font-lexend)' }}>
                {postCount}
              </div>
              <div className="text-white text-[10px] sm:text-xs mt-1 text-center px-1" style={{ fontFamily: 'var(--font-lexend)' }}>
                of {totalCount} {totalCount === 1 ? 'post' : 'posts'}
              </div>
            </>
          )}
        </div>
        
        
        {postCount !== undefined && totalCount !== undefined && totalCount > 0 && (
          <div className="absolute bottom-2 right-2 sm:hidden flex flex-col items-end z-10">
            <div className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-lexend)' }}>
              {postCount}
            </div>
            <div className="text-white text-[10px]" style={{ fontFamily: 'var(--font-lexend)' }}>
              of {totalCount} {totalCount === 1 ? 'post' : 'posts'}
            </div>
          </div>
        )}
        
        
        <div className="relative px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 z-10 pl-12 sm:pl-20 lg:pl-16">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-lexend)' }}>Explore</h1>
          <p className="text-white mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base" style={{ fontFamily: 'var(--font-lexend)' }}>
            Discover curated travel stories from the WorldMapPin community
          </p>
        </div>
      </div>
    </div>
  );
}

