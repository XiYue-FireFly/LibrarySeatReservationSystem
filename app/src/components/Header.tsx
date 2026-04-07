import React from 'react';
import { ArrowLeft, Bell, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: 'bell' | 'more' | null;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack = true, rightAction }) => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 h-16 shadow-sm shadow-primary/5">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-surface-container transition-colors active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
        )}
        <h1 className="font-headline font-bold text-lg tracking-tight text-primary">
          {title}
        </h1>
      </div>
      
      <div className="flex items-center">
        {rightAction === 'bell' && (
          <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Bell className="w-5 h-5" />
          </button>
        )}
        {rightAction === 'more' && (
          <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
        {!rightAction && <div className="w-10" />}
      </div>
    </header>
  );
};
