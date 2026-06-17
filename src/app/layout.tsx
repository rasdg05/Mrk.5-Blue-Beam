import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Autos MX — autos verificados con pago en Mercado Pago y crypto',
    template: '%s · Autos MX',
  },
  description:
    'Compraventa de autos usados verificados en México. Cada auto pasa revisión legal y se reserva con seña por Mercado Pago o crypto (stablecoins).',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <body>{children}</body>
    </html>
  );
}
