'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/shared/lib/utils';

export function ProductImages({ images }: { images: string[] }) {
  const normalizeSrc = (src: string) =>
    src.startsWith('/') || src.startsWith('http') ? src : `/images/${src}`;

  const [mainImage, setMainImage] = useState(normalizeSrc(images[0]));

  return (
    // 💡 max-w를 설정하여 이미지가 너무 거대해지는 것을 방지합니다.
    <div className="flex flex-col gap-4 w-full max-w-130 mx-auto lg:sticky lg:top-24">
      
      {/* 메인 이미지: 비율을 조절하여 세로로 너무 길지 않게 설정 (3/4 또는 4/5) */}
      <div className="relative aspect-square rounded-2xl overflow-hidden">
        <Image
          src={mainImage}
          alt="Product"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* 썸네일 리스트: 크기를 조금 더 줄이고 간격을 조절 */}
      <div className="grid grid-cols-5 gap-2 px-1">
        {images.map((img, i) => {
          const src = normalizeSrc(img);
          const isActive = mainImage === src;
          
          return (
            <button 
              key={i} 
              onClick={() => setMainImage(src)}
              className={cn(
                "relative aspect-square rounded-lg overflow-hidden transition-all hover:opacity-80",
                isActive ? "" : "opacity-60"
              )}
            >
              <Image 
                src={src} 
                alt={`thumb-${i}`} 
                fill 
                className="object-cover" 
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
