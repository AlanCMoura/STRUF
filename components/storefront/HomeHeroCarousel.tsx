"use client";

import Image from "next/image";
import { useState } from "react";

const slides = [
  "/banners/banner%20demonstra%C3%A7%C3%A3o%20struf.png",
  "/banners/banner-3.svg",
];

export default function HomeHeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative min-h-[380px] md:min-h-[580px]">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {slides.map((src, index) => (
            <div key={src} className="relative h-full w-full flex-shrink-0">
              <Image
                src={src}
                alt={`Banner principal Struf ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
                sizes="100vw"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="Banner anterior"
        onClick={goPrev}
        className="absolute left-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 cursor-pointer bg-black/35 text-white transition hover:bg-black/55 md:left-6"
      >
        <svg
          viewBox="0 0 24 24"
          className="mx-auto h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        aria-label="Proximo banner"
        onClick={goNext}
        className="absolute right-3 top-1/2 z-10 h-10 w-10 -translate-y-1/2 cursor-pointer bg-black/35 text-white transition hover:bg-black/55 md:right-6"
      >
        <svg
          viewBox="0 0 24 24"
          className="mx-auto h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}
