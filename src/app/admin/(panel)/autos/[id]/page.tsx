import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, CheckCircle2, ExternalLink, Trash2, AlertTriangle } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatMXN } from '@/lib/money';
import { carStatusLabel } from '@/lib/labels';
import { Badge, Button, Card, Field, Input, Select, buttonClasses } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';
import { CarForm } from '../car-form';
import {
  addCarPhoto,
  deleteCarPhoto,
  markSold,
  publishCar,
  recordCarVerification,
  unpublishCar,
  updateCar,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditCarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const car = await prisma.car.findUnique({
    where: { id },
    include: {
      brand: true,
      model: true,
      features: true,
      seller: true,
      photos: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
    },
  });
  if (!car) notFound();

  const ready =
    car.photos.length >= 1 &&
    car.priceMxn > 0 &&
    car.legalCheckStatus === 'APPROVED' &&
    (car.paymentMode !== 'DEPOSIT' || (!!car.depositType && !!car.depositValue));

  return (
    <div>
      <Link
        href="/admin/autos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={15} /> Autos
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{car.title}</h1>
          <Badge tone={car.status === 'PUBLISHED' ? 'green' : 'neutral'}>
            {carStatusLabel[car.status]}
          </Badge>
        </div>
        {car.status === 'PUBLISHED' && (
          <Link href={`/autos/${car.id}`} target="_blank" className={buttonClasses('outline', 'sm')}>
            Ver público <ExternalLink size={14} />
          </Link>
        )}
      </div>

      {/* Banners */}
      {sp.error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={16} /> {sp.error}
        </div>
      )}
      {(sp.saved || sp.published) && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} /> {sp.published ? 'Auto publicado.' : 'Cambios guardados.'}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Edit form */}
        <Card className="p-6">
          <CarForm action={updateCar} submitLabel="Guardar cambios" car={car} />
        </Card>

        {/* Side: photos, verification, publish */}
        <div className="space-y-6">
          {/* Photos */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700">Fotos ({car.photos.length})</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {car.photos.map((p) => (
                <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                  <form action={deleteCarPhoto} className="absolute right-1 top-1">
                    <input type="hidden" name="photoId" value={p.id} />
                    <input type="hidden" name="carId" value={car.id} />
                    <button
                      type="submit"
                      className="rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                      aria-label="Eliminar foto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
            <form action={addCarPhoto} className="mt-3 space-y-2">
              <input type="hidden" name="carId" value={car.id} />
              <Input name="url" placeholder="URL de la foto (Cloudinary…)" />
              <SubmitButton variant="outline" size="sm" className="w-full" pendingText="Agregando…">
                Agregar foto
              </SubmitButton>
            </form>
          </Card>

          {/* Verification (manual Buró Vehicular) */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700">Revisión legal (Buró Vehicular)</h3>
            <p className="mt-1 text-xs text-slate-500">
              Registra el resultado de la verificación manual antes de publicar.
            </p>
            <form action={recordCarVerification} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={car.id} />
              <Field label="Revisión legal">
                <Select name="legalCheckStatus" defaultValue={car.legalCheckStatus}>
                  <option value="PENDING">Pendiente</option>
                  <option value="APPROVED">Aprobada</option>
                  <option value="REJECTED">Rechazada</option>
                </Select>
              </Field>
              <Field label="REPUVE">
                <Select name="repuveStatus" defaultValue={car.repuveStatus}>
                  <option value="UNKNOWN">Sin consultar</option>
                  <option value="CLEAR">Sin reporte de robo</option>
                  <option value="REPORTED">Con reporte</option>
                </Select>
              </Field>
              <Field label="URL del reporte (opcional)">
                <Input name="verificationReportUrl" defaultValue={car.verificationReportUrl ?? ''} />
              </Field>
              <SubmitButton variant="outline" size="sm" className="w-full">
                Guardar verificación
              </SubmitButton>
            </form>
          </Card>

          {/* Publish */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-slate-700">Publicación</h3>
            <ul className="mt-2 space-y-1 text-xs">
              <Check ok={car.photos.length >= 1}>Al menos una foto</Check>
              <Check ok={car.priceMxn > 0}>Precio definido ({formatMXN(car.priceMxn)})</Check>
              <Check ok={car.legalCheckStatus === 'APPROVED'}>Revisión legal aprobada</Check>
              <Check ok={car.paymentMode !== 'DEPOSIT' || (!!car.depositType && !!car.depositValue)}>
                Anticipo configurado
              </Check>
            </ul>

            <div className="mt-4 space-y-2">
              {car.status !== 'PUBLISHED' ? (
                <form action={publishCar}>
                  <input type="hidden" name="id" value={car.id} />
                  <SubmitButton className="w-full" size="md" pendingText="Publicando…">
                    Publicar auto
                  </SubmitButton>
                </form>
              ) : (
                <form action={unpublishCar}>
                  <input type="hidden" name="id" value={car.id} />
                  <SubmitButton variant="outline" className="w-full">
                    Despublicar
                  </SubmitButton>
                </form>
              )}
              {car.status !== 'SOLD' && (
                <form action={markSold}>
                  <input type="hidden" name="id" value={car.id} />
                  <Button type="submit" variant="ghost" size="sm" className="w-full">
                    Marcar como vendido
                  </Button>
                </form>
              )}
            </div>
            {!ready && car.status !== 'PUBLISHED' && (
              <p className="mt-2 text-xs text-amber-600">Completa los requisitos para publicar.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? 'flex items-center gap-1.5 text-emerald-600' : 'flex items-center gap-1.5 text-slate-400'}>
      <CheckCircle2 size={13} /> {children}
    </li>
  );
}
