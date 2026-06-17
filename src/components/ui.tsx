import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: 'bg-slate-900 text-white hover:bg-slate-800',
  outline: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
  ghost: 'text-slate-700 hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ className, variant = 'primary', size = 'md', ...props }: ButtonProps) {
  return <button className={cn(buttonClasses(variant, size), className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
const fieldBase =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-24', className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldBase, 'pr-8', className)} {...props} />;
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1 block text-sm font-medium text-slate-700', className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badge / Card
// ---------------------------------------------------------------------------
type BadgeTone = 'neutral' | 'green' | 'amber' | 'red' | 'blue';
const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-brand-100 text-brand-800',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    />
  );
}
