'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui';

type Props = React.ComponentProps<typeof Button> & { pendingText?: string };

export function SubmitButton({ children, pendingText, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? (pendingText ?? 'Guardando…') : children}
    </Button>
  );
}
