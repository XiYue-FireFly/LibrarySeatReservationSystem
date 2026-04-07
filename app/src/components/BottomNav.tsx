import React from 'react';
import { Calendar, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-6 pt-3 bg-surface/90 backdrop-blur-xl rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
      <NavLink 
        to="/labs" 
        className={({ isActive }) => `
          flex flex-col items-center justify-center px-6 py-2 rounded-xl transition-all active:scale-90
          ${isActive ? 'text-primary bg-primary/10' : 'text-outline hover:text-primary'}
        `}
      >
        <Calendar className="w-6 h-6 mb-0.5" />
        <span className="font-headline text-[11px] font-semibold uppercase tracking-widest">预约</span>
      </NavLink>
      
      <NavLink 
        to="/profile" 
        className={({ isActive }) => `
          flex flex-col items-center justify-center px-6 py-2 rounded-xl transition-all active:scale-90
          ${isActive ? 'text-primary bg-primary/10' : 'text-outline hover:text-primary'}
        `}
      >
        <User className="w-6 h-6 mb-0.5" />
        <span className="font-headline text-[11px] font-semibold uppercase tracking-widest">个人中心</span>
      </NavLink>
    </nav>
  );
};
