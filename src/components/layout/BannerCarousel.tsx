import { useEffect, useRef, useState } from "react";

export const BannerCarousel = () => {
  const imageUrls = [
    "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/1.webp",
    "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/2.png",
    "https://kmxmlfhkojdbuoktavul.supabase.co/storage/v1/object/public/static/3.png",
  ];

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % imageUrls.length);
    }, 3500);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [isPaused, imageUrls.length]);

  const prev = () =>
    setIndex((i) => (i - 1 + imageUrls.length) % imageUrls.length);
  const next = () => setIndex((i) => (i + 1) % imageUrls.length);

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full h-40 md:h-56 lg:h-72 bg-gray-100">
        {imageUrls.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`banner-${i}`}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />
        ))}
      </div>

      <button
        onClick={prev}
        aria-label="Previous"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2"
      >
        ‹
      </button>

      <button
        onClick={next}
        aria-label="Next"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2"
      >
        ›
      </button>
    </div>
  );
};
