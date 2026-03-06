import React from 'react';
import { Icon } from '@iconify/react';

interface SubscriptionAvatarProps {
  name: string;
  icon?: string | null;
  // imageUrl removed: avatars no longer render external images
  color?: string;
  // classes that control size / border radius etc. e.g. "h-10 w-10 rounded-xl"
  sizeClass?: string;
  // additional classes to apply (shadows, rings, hover)
  className?: string;
  // pixel size for the svg icon
  iconPx?: number;
  alt?: string;
}

export default function SubscriptionAvatar({
  name,
  icon,
  // imageUrl removed
  color = 'hsl(220, 80%, 50%)',
  sizeClass = 'w-8 h-8',
  className = '',
  iconPx,
  alt,
}: SubscriptionAvatarProps) {
  const container = `${sizeClass} ${className}`.trim();

  const renderInitial = () => (
    <div
      className={`${container} flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: color }}
    >
      {String(name).charAt(0).toUpperCase()}
    </div>
  );

  // No image support: fall through to icon/initial rendering

  // If icon is absent or too short (single letter used as initial), show initial
  if (!icon || (typeof icon === 'string' && icon.trim().length <= 1)) {
    return renderInitial();
  }

  const lower = String(icon).toLowerCase();
  // Treat single-character icons or icons equal to the name initial as no-icon
  const nameInitial = String(name).charAt(0).toLowerCase();
  if (lower.trim().length <= 1 || lower === nameInitial) {
    return renderInitial();
  }
  const slugMap: Record<string, string> = {
    disney: 'disneyplus',
    'disney+': 'disneyplus',
    'disney-plus': 'disneyplus',
    'disneyplus': 'disneyplus',
  };

  const candidate = slugMap[lower] ?? lower;

  const iconName = (candidate === 'disney' || candidate === 'disneyplus')
    ? 'streamline-logos:disney-plus-logo-solid' : ((candidate === 'mycanal' || candidate === 'canal+' || candidate === 'canalplus') ? 'arcticons:mycanal'
    : `simple-icons:${candidate}`);

  return (
    <div className={`${container} flex items-center justify-center font-bold text-white`} style={{ backgroundColor: color }}>
      <Icon icon={iconName} width={iconPx ?? 16} height={iconPx ?? 16} className="text-white" />
    </div>
  );
}
