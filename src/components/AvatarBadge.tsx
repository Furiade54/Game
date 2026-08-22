import React from 'react';
import {
  Crown,
  Cat,
  Dog,
  Flame,
  Sparkles,
  Zap,
  Smile,
  Star,
  Heart,
  Ghost,
  Rocket,
  Shield,
  User
} from 'lucide-react';

export const AVATAR_ICONS: Record<string, React.ElementType> = {
  crown: Crown,
  cat: Cat,
  dog: Dog,
  flame: Flame,
  sparkles: Sparkles,
  zap: Zap,
  smile: Smile,
  star: Star,
  heart: Heart,
  ghost: Ghost,
  rocket: Rocket,
  shield: Shield,
  user: User
};

export const COLOR_PALETTE = [
  '#FF10F0', // Electric Neon Pink
  '#39FF14', // Neon Toxic Green
  '#00F0FF', // Neon Cyan
  '#FFE600', // Neon Yellow
  '#FF3366', // Electric Coral
  '#9D00FF', // Electric Purple
  '#FF6B00', // Blaze Orange
  '#00E5FF', // Ice Blue
  '#00FF88', // Spring Green
  '#FF0055'  // Radical Red
];

interface AvatarBadgeProps {
  iconName?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showCrown?: boolean;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  iconName = 'smile',
  color = '#FF10F0',
  size = 'md',
  className = '',
  showCrown = false
}) => {
  const IconComponent = AVATAR_ICONS[iconName] || Smile;

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-3xl',
    '2xl': 'w-28 h-28 text-5xl'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
    xl: 40,
    '2xl': 56
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className={`rounded-xl flex items-center justify-center font-bold text-black border-2 border-black/80 transition-transform shadow-[3px_3px_0px_0px_#000000] ${sizeClasses[size]} ${className}`}
        style={{ backgroundColor: color }}
      >
        <IconComponent size={iconSizes[size]} strokeWidth={2.5} className="text-black" />
      </div>
      {showCrown && (
        <div className="absolute -top-2 -right-2 bg-[#FFE600] text-black p-1 rounded-md shadow-[2px_2px_0px_0px_#000000] border-2 border-black">
          <Crown size={12} strokeWidth={3} />
        </div>
      )}
    </div>
  );
};
