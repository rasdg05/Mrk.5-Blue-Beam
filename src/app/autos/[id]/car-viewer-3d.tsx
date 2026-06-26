'use client';

import { createElement, useEffect, useRef, useState } from 'react';
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';

// model-viewer is a web component; loading this module registers <model-viewer>.
// It auto-generates a USDZ from the GLB for iOS AR Quick Look (no separate file).
const MV_SRC = 'https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js';

// Live paint colors applied to the "Body_Color" material (CSR2-style).
const COLORS = [
  { name: 'Azul Bugatti', hex: '#1b3a6b', rgb: [0.106, 0.227, 0.42] },
  { name: 'Negro', hex: '#161616', rgb: [0.086, 0.086, 0.086] },
  { name: 'Plata', hex: '#c7ccd1', rgb: [0.78, 0.8, 0.82] },
  { name: 'Rojo', hex: '#8e1418', rgb: [0.557, 0.078, 0.094] },
  { name: 'Amarillo', hex: '#e3a712', rgb: [0.89, 0.655, 0.071] },
];

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
  const [color, setColor] = useState(0);
  const [view, setView] = useState<'exterior' | 'interior'>('exterior');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mvRef = useRef<any>(null);
  const colorRef = useRef(0);
  colorRef.current = color;

  function applyColor(i: number) {
    const mv = mvRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mat = mv?.model?.materials?.find((m: any) => m.name === 'Body_Color');
    mat?.pbrMetallicRoughness?.setBaseColorFactor([...COLORS[i]!.rgb, 1]);
  }

  function changeView(v: 'exterior' | 'interior') {
    setView(v);
    const mv = mvRef.current;
    if (!mv) return;
    if (v === 'interior') {
      mv.cameraTarget = '0m 1.0m 0.1m';
      mv.cameraOrbit = '-12deg 84deg 1.7m';
      mv.autoRotate = false;
    } else {
      mv.cameraTarget = 'auto';
      mv.cameraOrbit = '-25deg 72deg auto';
      mv.autoRotate = true;
    }
  }

  useEffect(() => {
    if (open) loadModelViewer();
  }, [open]);

  // Apply the chosen paint once the model has loaded (and on later changes).
  useEffect(() => {
    if (!open) return;
    const mv = mvRef.current;
    if (!mv) return;
    const onLoad = () => applyColor(colorRef.current);
    mv.addEventListener('load', onLoad);
    if (mv.loaded) applyColor(colorRef.current);
    return () => mv.removeEventListener('load', onLoad);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) applyColor(color);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, color]);

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
      <div className="relative">
        {createElement(
          'model-viewer',
          {
            ref: mvRef,
            src,
            alt: `Modelo 3D de ${title}`,
            ar: '',
            'ar-modes': 'webxr scene-viewer quick-look',
            'ar-scale': 'auto',
            'ar-placement': 'floor',
            'camera-controls': '',
            'auto-rotate': '',
            'auto-rotate-delay': '600',
            'rotation-per-second': '22deg',
            'interaction-prompt': 'none',
            'camera-orbit': '-25deg 72deg auto',
            'field-of-view': '32deg',
            'min-field-of-view': '12deg',
            'shadow-intensity': '1',
            'shadow-softness': '0.85',
            exposure: '1',
            'tone-mapping': 'neutral',
            'environment-image': '/models/studio.hdr',
            'touch-action': 'pan-y',
            loading: 'eager',
            style: { width: '100%', height: '480px', backgroundColor: '#eef2f6' },
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

        {/* Demo-only controls — the sample model supports live paint + interior.
            Real scanned models (exterior) just orbit + AR. */}
        {sample ? (
          <>
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2 py-1.5 shadow-sm backdrop-blur">
              {COLORS.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={`Color ${c.name}`}
                  onClick={() => setColor(i)}
                  className={cn(
                    'h-6 w-6 rounded-full ring-2 ring-offset-1 transition',
                    color === i ? 'ring-brand-500' : 'ring-transparent hover:ring-slate-300',
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>

            <div className="absolute right-3 top-3 flex rounded-full bg-white/85 p-1 text-xs font-medium shadow-sm backdrop-blur">
              {(['exterior', 'interior'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => changeView(v)}
                  className={cn(
                    'rounded-full px-3 py-1 transition-colors',
                    view === v ? 'bg-brand-600 text-white' : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {v === 'exterior' ? 'Exterior' : 'Interior'}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Box size={13} />{' '}
          {sample
            ? 'Gira · cambia de color · entra al interior'
            : 'Gira · pellizca para acercar · tamaño real'}
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
