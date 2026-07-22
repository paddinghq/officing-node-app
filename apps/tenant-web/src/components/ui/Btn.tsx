/**
 * Btn — brand-aware button built on HeroUI <Button>.
 * Variant "brand" uses CSS var(--brand-primary) automatically.
 */
import { Button as HeroButton, Spinner } from '@heroui/react';
import type { ReactNode } from 'react';

// HeroUI v3 ButtonRootProps doesn't include `children` in its TypeScript
// definition even though the component renders them at runtime.
// Cast to a compatible type so we can pass children without TS errors.
const Button = HeroButton as unknown as React.FC<React.ComponentPropsWithRef<'button'> & {
  variant?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  children?: ReactNode;
}>;

type Variant = 'brand' | 'secondary' | 'ghost' | 'danger' | 'danger-soft';
type Size    = 'sm' | 'md' | 'lg';

interface Props {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  fullWidth?: boolean;
}

const HERO_VARIANT: Record<Variant, string> = {
  brand:       'primary',
  secondary:   'outline',
  ghost:       'ghost',
  danger:      'danger',
  'danger-soft': 'danger-soft',
};

const SIZE_CLS: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs h-auto',
  md: 'px-4 py-2 text-sm h-auto',
  lg: 'px-5 py-2.5 text-sm h-auto',
};

export function Btn({
  children, variant = 'brand', size = 'md', loading, disabled, type = 'button',
  onClick, className = '', style, fullWidth,
}: Props) {
  const brandStyle: React.CSSProperties =
    variant === 'brand'
      ? { background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)', color: '#fff', ...style }
      : style ?? {};

  return (
    <Button
      type={type}
      variant={HERO_VARIANT[variant] as never}
      isDisabled={disabled || loading}
      onPress={onClick}
      fullWidth={fullWidth}
      className={`inline-flex items-center gap-2 font-medium rounded-xl transition-all ${SIZE_CLS[size]} ${className}`}
      style={brandStyle}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </Button>
  );
}
