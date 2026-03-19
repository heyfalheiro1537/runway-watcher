/**
 * Logotipo InfraSegura (avião — ver CREDITS.md: Good Ware / Flaticon).
 * Asset em /public/aviao.png
 */
interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClass: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-9 w-9',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  return (
    <img
      src="/aviao.png"
      alt="InfraSegura"
      width={256}
      height={256}
      decoding="async"
      className={`object-contain shrink-0 drop-shadow-sm ${sizeClass[size]} ${className}`}
    />
  );
}
