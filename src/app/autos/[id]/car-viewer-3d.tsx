'use client';

import { createElement, useEffect, useState } from 'react';
import { Box } from 'lucide-react';

// model-viewer is a web component; loading this module registers <model-viewer>.
// It auto-generates a USDZ from the GLB for iOS AR Quick Look (no separate file).
const MV_SRC = 'https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js';

function loadModelViewer() {
  if (typeof window === 'undefined') return;
  if (document.querySelector('script[data-model-viewer]')) return;
  const s = document.createElement('script');
  s.type = 'module';
  s.src = MV_SRC;
  s.setAttribute('data-model-viewer', '');
  document.head.appendChild(s);
}

export function CarViewer3D({
  src,
  title,
  sample = false,
}: {
  src: string;
  title: string;
  sample?: boolean;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) loadModelViewer();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition duration-200 hover:border-brand-300 hover:bg-brand-50/40 active:scale-[0.99]"
      >
        <Box size={18} className="text-brand-600 transition-transform duration-300 group-hover:scale-110" />
        Ver en 3D · Realidad Aumentada
      </button>
    );
  }

  return (
    <div className="animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-card">
      {createElement(
        'model-viewer',
        {
          src,
          alt: `Modelo 3D de ${title}`,
          ar: '',
          'ar-modes': 'webxr scene-viewer quick-look',
          'ar-scale': 'auto',
          'camera-controls': '',
          'auto-rotate': '',
          'auto-rotate-delay': '0',
          'rotation-per-second': '24deg',
          'shadow-intensity': '1',
          'environment-image': 'neutral',
          'touch-action': 'pan-y',
          loading: 'eager',
          style: { width: '100%', height: '440px', backgroundColor: '#f1f5f9' },
        },
        createElement(
          'button',
          {
            slot: 'ar-button',
            className:
              'absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-700',
          },
          '📱 Ver en tu garage (AR)',
        ),
      )}
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Box size={13} /> Arrastra para girar · pellizca para acercar
        </span>
        {sample ? (
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            Modelo de muestra
          </span>
        ) : null}
      </div>
    </div>
  );
}
