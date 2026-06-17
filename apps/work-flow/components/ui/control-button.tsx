
import * as LucideIcons from 'lucide-react';
import IconComponent from '../icon/icon-component';
const ControlButton: React.FC<{
    onClick: () => void;
    title: string;
    disabled?: boolean;
    iconName: keyof typeof LucideIcons;
    iconClass: string;
    isLocked:boolean;
    buttonBaseClass:string
  }> = ({ onClick, title, disabled = false, iconName, iconClass,isLocked, buttonBaseClass}) => (
    <button
      onClick={onClick}
      className={buttonBaseClass}
      title={title}
      disabled={disabled && isLocked}
    >
      <IconComponent icon={iconName} size={20} className={iconClass} />
    </button>
  );
  export default ControlButton