import { prisma } from '@/lib/db';
import { Badge, Button, Card } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { setSellerKyc } from './actions';
import type { KycStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const KYC_TONE: Record<KycStatus, 'green' | 'amber' | 'red' | 'neutral'> = {
  VERIFIED: 'green',
  PENDING: 'amber',
  REJECTED: 'red',
  NONE: 'neutral',
};

const KYC_LABEL: Record<KycStatus, string> = {
  VERIFIED: 'Verificado',
  PENDING: 'Pendiente',
  REJECTED: 'Rechazado',
  NONE: 'Sin KYC',
};

export default async function SellersPage() {
  const sellers = await prisma.seller.findMany({
    orderBy: { createdAt: 'desc' },
    include: { kyc: true, _count: { select: { cars: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Vendedores</h1>
      <p className="mt-1 text-sm text-slate-500">
        Verificación (KYC) de vendedores de terceros para una operación en regla.
      </p>

      <Card className="mt-6 divide-y divide-slate-100">
        {sellers.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">Aún no hay vendedores registrados.</p>
        ) : (
          sellers.map((s) => {
            const status = s.kyc?.status ?? 'NONE';
            return (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="text-xs text-slate-500">
                    {s.email} · {s.phone ?? 'sin teléfono'} · {s._count.cars} autos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={KYC_TONE[status]}>{KYC_LABEL[status]}</Badge>
                  {status !== 'VERIFIED' && (
                    <form action={setSellerKyc}>
                      <input type="hidden" name="sellerId" value={s.id} />
                      <input type="hidden" name="status" value="VERIFIED" />
                      <SubmitButton variant="outline" size="sm">
                        Verificar
                      </SubmitButton>
                    </form>
                  )}
                  {status !== 'REJECTED' && (
                    <form action={setSellerKyc}>
                      <input type="hidden" name="sellerId" value={s.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <Button type="submit" variant="ghost" size="sm">
                        Rechazar
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
