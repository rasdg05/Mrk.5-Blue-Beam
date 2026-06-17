'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Gallery({ photos, title }: { photos: { url: string }[]; title: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-100 text-slate-300">
        <Car size={48} />
      </div>
    );
  }

  const main = photos[active] ?? photos[0]!;

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-100">
        <Image
          src={main.url}
          alt={title}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-offset-2 transition',
                i === active ? 'ring-2 ring-brand-500' : 'opacity-80 hover:opacity-100',
              )}
            >
              <Image src={p.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
