import { Sprout } from "lucide-react";

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo = ({ size = 'md' }: LogoProps) => {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-lg' },
    md: { icon: 'h-6 w-6', text: 'text-xl' },
    lg: { icon: 'h-8 w-8', text: 'text-2xl' },
  };

  return (
    <div className={`flex items-center gap-2 ${sizes[size].text}`}>
      <Sprout className={`${sizes[size].icon} text-primary`} />
      {/* Removido o texto "Raízes da Fé" */}
    </div>
  );
};