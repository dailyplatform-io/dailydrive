import { X } from 'lucide-react';
import './Drawer.css';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children, actions }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-header">
          <h3 className="drawer-title">{title}</h3>
          <button className="drawer-close" onClick={onClose} aria-label="Close drawer">
            <X size={24} />
          </button>
        </div>

        <div className="drawer-content">
          {children}
        </div>

        {actions && (
          <div className="drawer-actions">
            {actions}
          </div>
        )}
      </aside>
    </>
  );
};
