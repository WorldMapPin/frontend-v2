'use client';

import React, { useState, useEffect } from 'react';

const images = [
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/sofathana/EqBcB9LmxN2S38qHeTWAvkqFmaKgVaFYrdTcBzroY1PSRJBQ5onsqf6T4SRYRDzPnyo.JPG',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/sofathana/EqjXEkwhoqGj2mqDD1wz1ijmV24z3KhGVTjbAnCkxe6dDgGnCoDW1VT57csPqLrgiVL.JPG',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/ibarra95/243LxnZCJHDkT3RgsEumAHeNCsvbBH7oGa5JTZpNqRtzMAeSgPUD9Tp4541cr4h4Tt7e4.jpeg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/danavilar/242ruTaCWBWxcqqMi4BRky6hDaccA7sYAPaGvxy3AKPGBLe3X8PSdvpxxmkePTWy1E7hr.jpeg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/avdesing/23uFPkatb8VafH4RScqPhnYqFazRzUTyBLWm4y88QsvLnVGcVpJW4YX1chbiJ4wsrsUim.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/biologistbrito/246amwZhYYn2iLD8xfo5HmfjF93QhWSHHSkh87EAwkZ348TxkWP8UcbbtVfSTpS9rK8DJ.JPG',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/livinguktaiwan/2458C3rcJANS76CKb7Py3Cd4jtDhU6r54iX96KaoynYaXXVHsSQyN6khmHsx73scYM1k8.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/vaynard86/23vi49n6kBTWULAzydX2uKdzPRLDzQSSgLXuDjYZxM8Pb7kVFjDUr9xyhWDmeSVytY7uB.png',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/ramon2024/Eqb3VFRAVPBoYDtqEJ1EPFk9RvL1fYBxdu6MN2RwSU1s6CCvimxUeMrtPLwYQEnLg3Y.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/ramon2024/Eq7NJPPEtw4uSW9mrm1LWNANmWHQ1ys5TXAu527Z6ftWq8bopVMzP5EocSnUfJ8r5PY.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/nanixxx/23tbHF25D2v5pa2jWGZ7BuepZD9mvwckoP3pRFzUAPM7SRbrKwdUG1YySENtcToN4R1pq.jpg',
  'https://images.ecency.com/DQmUmBrkwFX6vmLjjoEBZYerDSbY3Ru5ynnUYCr1mmrtavL/1765162629900.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/darine.darine/23uaMgW5ZkdCzYqouaTmpsmJKrpRsiqE8f5FVuHyeCfkRQPfX41mJe68KdnvNhMBnmJTn.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/terresco/EoeCZD7e15WUu914cpzMwEG6xvEiRkYEsPYBckkYGxstwdEPFTHEhhca9858sKMJ7hd.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/onyfest/242DGWL9bvA1iSjdvomtkVGHKWdRYryQAD2L4FPd3jseQXB1UUsGRMYARqw6satSM2his.jpg',
  'https://images.hive.blog/0x0/https://img.leopedia.io/DQmeG6EyXABY1aYPRKJjgRACcrQa2GsrGRi1ux55d3Ha2bb/1764484844328.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/dodovietnam/23zbKTKuLLsnFHt4kB4VACamNyum1VdmUwqyacX5cw4Sge4QmUCB4pcwW5pjxkQSaS1LD.jpg',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/hindavi/23wMMd3Ht3pfUaedoN7UQm3vfaZHY9KGXPjoX7nL7G7WSwgKp2wc5UUYqt4ruP7m7gEqB.jpg',
  'https://wsrv.nl/?url=https://files.peakd.com/file/peakd-hive/greddyforce/23zv98wxxGqnB9BjGFvKsHwX7eLV7e6bK81FtqLuYd1UjJN2Skot7wr8563DWbGNWT1R5.jpg&q=80&l=7&output=webp',
  'https://images.hive.blog/0x0/https://files.peakd.com/file/peakd-hive/relf87/EpnAn9ooQ9agFqGvA9hMZZ7JRcYk3Zx2q1amR9DLGg8GDXjurbVnrBC5QCTwbURUkvD.JPG',
];

// Duplicate images for seamless horizontal loop
const duplicatedImages = [...images, ...images];

const HeroBackgroundGrid = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until client-side hydration is complete
  if (!isMounted) {
    return null;
  }

  return (
    <div className="hero-grid-container">
      {/* Animated grid layer */}
      <div className="hero-grid-track">
        {duplicatedImages.map((src, index) => (
          <div key={index} className="hero-grid-cell">
            <img
              src={src}
              alt=""
              className="hero-grid-image"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay - strong center mask for text readability */}
      <div className="hero-grid-overlay" />

      <style jsx>{`
        .hero-grid-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .hero-grid-track {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(3, 1fr);
          gap: 6px;
          width: 200%;
          height: 120%;
          position: absolute;
          top: -10%;
          left: 0;
          opacity: 0.25;
          animation: drift-mobile 60s linear infinite;
        }

        .hero-grid-cell {
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 8px;
          box-shadow: 0 1px 8px rgba(0, 0, 0, 0.08);
        }

        .hero-grid-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-grid-overlay {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(
              ellipse 80% 70% at 50% 45%,
              rgba(237, 109, 40, 0.9) 0%,
              rgba(245, 130, 50, 0.65) 35%,
              rgba(255, 166, 0, 0.35) 65%,
              transparent 100%
            ),
            linear-gradient(
              to bottom,
              rgba(237, 109, 40, 0.75) 0%,
              transparent 20%,
              transparent 75%,
              rgba(255, 255, 255, 0.95) 100%
            );
          pointer-events: none;
        }

        @keyframes drift-mobile {
          0% {
            transform: translateX(0) rotate(-4deg);
          }
          100% {
            transform: translateX(-50%) rotate(-4deg);
          }
        }

        @keyframes drift-tablet {
          0% {
            transform: translateX(0) rotate(-5deg);
          }
          100% {
            transform: translateX(-50%) rotate(-5deg);
          }
        }

        @keyframes drift-desktop {
          0% {
            transform: translateX(0) rotate(-6deg);
          }
          100% {
            transform: translateX(-50%) rotate(-6deg);
          }
        }

        /* Tablet and up */
        @media (min-width: 768px) {
          .hero-grid-track {
            grid-template-columns: repeat(6, 1fr);
            grid-template-rows: repeat(4, 1fr);
            gap: 8px;
            opacity: 0.28;
            animation: drift-tablet 58s linear infinite;
          }

          .hero-grid-cell {
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }

          .hero-grid-overlay {
            background: 
              radial-gradient(
                ellipse 75% 65% at 50% 45%,
                rgba(237, 109, 40, 0.87) 0%,
                rgba(245, 130, 50, 0.62) 38%,
                rgba(255, 166, 0, 0.32) 68%,
                transparent 100%
              ),
              linear-gradient(
                to bottom,
                rgba(237, 109, 40, 0.72) 0%,
                transparent 22%,
                transparent 78%,
                rgba(255, 255, 255, 0.92) 100%
              );
          }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .hero-grid-track {
            grid-template-columns: repeat(8, 1fr);
            grid-template-rows: repeat(5, 1fr);
            gap: 10px;
            height: 130%;
            top: -15%;
            opacity: 0.3;
            animation: drift-desktop 55s linear infinite;
          }

          .hero-grid-cell {
            border-radius: 12px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          }

          .hero-grid-overlay {
            background: 
              radial-gradient(
                ellipse 70% 60% at 50% 45%,
                rgba(237, 109, 40, 0.85) 0%,
                rgba(245, 130, 50, 0.6) 40%,
                rgba(255, 166, 0, 0.3) 70%,
                transparent 100%
              ),
              linear-gradient(
                to bottom,
                rgba(237, 109, 40, 0.7) 0%,
                transparent 25%,
                transparent 80%,
                rgba(255, 255, 255, 0.9) 100%
              );
          }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .hero-grid-track {
            animation: none !important;
          }
        }

        /* Performance optimization for mobile */
        @media (max-width: 767px) {
          .hero-grid-track {
            will-change: transform;
            backface-visibility: hidden;
            transform: translateZ(0);
          }
        }
      `}</style>
    </div>
  );
};

export default HeroBackgroundGrid;
