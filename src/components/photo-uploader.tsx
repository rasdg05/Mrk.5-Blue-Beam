'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';
import { addCarPhoto } from '@/app/admin/(panel)/autos/actions';

const WIDGET_SRC = 'https://upload-widget.cloudinary.com/global/all.js';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cloudinary?: any;
  }
}

/**
 * Cloudinary upload widget button. Uploads go straight from the browser to
 * Cloudinary (unsigned preset) — no server size limit — and each resulting URL
 * is persisted via the existing `addCarPhoto` server action.
 */
export function PhotoUploader({
  carId,
  cloudName,
  uploadPreset,
}: {
  carId: string;
  cloudName: string;
  uploadPreset: string;
}) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function init() {
      if (cancelled || !window.cloudinary || widgetRef.current) return;
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          multiple: true,
          sources: ['local', 'camera', 'url'],
          maxImageFileSize: 10_000_000,
          folder: 'autosmx',
          styles: { palette: { action: '#1e66f1', link: '#1e66f1' } },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (error: unknown, result: any) => {
          if (!error && result?.event === 'success' && result.info?.secure_url) {
            setBusy(true);
            const fd = new FormData();
            fd.set('carId', carId);
            fd.set('url', String(result.info.secure_url));
            try {
              await addCarPhoto(fd);
              router.refresh();
            } finally {
              setBusy(false);
            }
          }
        },
      );
      setReady(true);
    }

    if (window.cloudinary) {
      init();
    } else {
      let script = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = WIDGET_SRC;
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', init);
    }

    return () => {
      cancelled = true;
    };
  }, [carId, cloudName, uploadPreset, router]);

  const open = useCallback(() => widgetRef.current?.open(), []);

  return (
    <button
      type="button"
      onClick={open}
      disabled={!ready || busy}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <UploadCloud size={16} />
      {busy ? 'Guardando…' : ready ? 'Subir fotos' : 'Cargando…'}
    </button>
  );
}
