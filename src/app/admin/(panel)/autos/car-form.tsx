import { Field, Input, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/submit-button';

interface CarFormCar {
  id: string;
  title: string;
  vin: string | null;
  year: number;
  mileageKm: number;
  priceMxn: number;
  transmission: string;
  fuel: string;
  color: string | null;
  doors: number | null;
  description: string | null;
  locationCity: string | null;
  locationState: string | null;
  ownership: string;
  paymentMode: string;
  depositType: string | null;
  depositValue: number | null;
  acceptsMercadoPago: boolean;
  acceptsCrypto: boolean;
  brand: { name: string };
  model: { name: string };
  features: { label: string }[];
  seller: { email: string } | null;
}

export function CarForm({
  action,
  submitLabel,
  car,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  car?: CarFormCar | null;
}) {
  const c = car ?? null;
  const depositDefault =
    c && c.depositValue != null
      ? c.depositType === 'FIXED'
        ? c.depositValue / 100
        : c.depositValue / 100
      : '';

  return (
    <form action={action} className="space-y-6">
      {c && <input type="hidden" name="id" value={c.id} />}

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Marca">
          <Input name="brandName" required defaultValue={c?.brand.name} placeholder="Toyota" />
        </Field>
        <Field label="Modelo">
          <Input name="modelName" required defaultValue={c?.model.name} placeholder="Hilux" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Título de la publicación">
            <Input name="title" required defaultValue={c?.title} placeholder="Toyota Hilux 2019 SR 4x4" />
          </Field>
        </div>
        <Field label="Año">
          <Input name="year" type="number" required defaultValue={c?.year} />
        </Field>
        <Field label="Kilometraje">
          <Input name="mileageKm" type="number" required defaultValue={c?.mileageKm} />
        </Field>
        <Field label="Transmisión">
          <Select name="transmission" defaultValue={c?.transmission ?? 'AUTOMATIC'}>
            <option value="AUTOMATIC">Automática</option>
            <option value="MANUAL">Manual</option>
          </Select>
        </Field>
        <Field label="Combustible">
          <Select name="fuel" defaultValue={c?.fuel ?? 'GASOLINE'}>
            <option value="GASOLINE">Gasolina</option>
            <option value="DIESEL">Diésel</option>
            <option value="HYBRID">Híbrido</option>
            <option value="ELECTRIC">Eléctrico</option>
            <option value="GAS">Gas LP</option>
          </Select>
        </Field>
        <Field label="Color">
          <Input name="color" defaultValue={c?.color ?? ''} />
        </Field>
        <Field label="Puertas">
          <Input name="doors" type="number" defaultValue={c?.doors ?? ''} />
        </Field>
        <Field label="VIN / NIV">
          <Input name="vin" defaultValue={c?.vin ?? ''} />
        </Field>
        <Field label="Ciudad">
          <Input name="locationCity" defaultValue={c?.locationCity ?? ''} />
        </Field>
        <Field label="Estado">
          <Input name="locationState" defaultValue={c?.locationState ?? ''} />
        </Field>
      </section>

      <Field label="Descripción">
        <Textarea name="description" defaultValue={c?.description ?? ''} rows={4} />
      </Field>
      <Field label="Equipamiento (separado por comas)" hint="Ej. Aire, Quemacocos, Cámara de reversa">
        <Input name="features" defaultValue={c?.features.map((f) => f.label).join(', ') ?? ''} />
      </Field>

      {/* Pricing & payment config */}
      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Precio y cobro</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio (MXN)">
            <Input name="priceMxn" type="number" step="1" required defaultValue={c ? c.priceMxn / 100 : ''} />
          </Field>
          <Field label="Procedencia">
            <Select name="ownership" defaultValue={c?.ownership ?? 'PLATFORM'}>
              <option value="PLATFORM">Stock propio</option>
              <option value="THIRD_PARTY">Tercero (consignación)</option>
            </Select>
          </Field>
          <Field label="Email del vendedor (si es de tercero)">
            <Input name="sellerEmail" type="email" defaultValue={c?.seller?.email ?? ''} />
          </Field>
          <Field label="Modo de pago">
            <Select name="paymentMode" defaultValue={c?.paymentMode ?? 'DEPOSIT'}>
              <option value="DEPOSIT">Anticipo / reserva</option>
              <option value="FULL">Pago total (solo stock propio)</option>
            </Select>
          </Field>
          <Field label="Tipo de anticipo">
            <Select name="depositType" defaultValue={c?.depositType ?? 'PERCENT'}>
              <option value="PERCENT">Porcentaje (%)</option>
              <option value="FIXED">Monto fijo (MXN)</option>
            </Select>
          </Field>
          <Field label="Valor del anticipo" hint="% si es porcentaje, MXN si es monto fijo">
            <Input name="depositValue" type="number" step="0.01" defaultValue={depositDefault} />
          </Field>
        </div>
        <div className="mt-3 flex gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="acceptsMercadoPago" defaultChecked={c?.acceptsMercadoPago ?? true} />
            Acepta Mercado Pago
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="acceptsCrypto" defaultChecked={c?.acceptsCrypto ?? false} />
            Acepta crypto (stablecoins)
          </label>
        </div>
      </section>

      <SubmitButton size="lg">{submitLabel}</SubmitButton>
    </form>
  );
}
