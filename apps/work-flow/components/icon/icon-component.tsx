
import * as LucideIcons from 'lucide-react';
const IconComponent = ({ 
  icon, 
  size, 
  className 
}: { 
  icon: keyof typeof LucideIcons; 
  size: number; 
  className: string;
}) => {
  const Icon = LucideIcons[icon] as React.ElementType;
  return <Icon size={size} className={className} />;
};
export default IconComponent