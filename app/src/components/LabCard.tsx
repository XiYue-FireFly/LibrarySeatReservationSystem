import React from 'react';
import { Users, MapPin, ChevronRight, AlertCircle } from 'lucide-react';
import { ApiLab } from '../types';
import { useNavigate } from 'react-router-dom';

interface LabCardProps {
  lab: ApiLab;
}

const FALLBACK_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-700',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
];

export const LabCard: React.FC<LabCardProps> = ({ lab }) => {
  const navigate = useNavigate();
  const isAvailable = lab.status === 'AVAILABLE';
  const colorClass = FALLBACK_COLORS[lab.id % FALLBACK_COLORS.length];

  return (
    <div 
      onClick={() => isAvailable && navigate(`/reservation/${lab.id}`)}
      className={`group bg-surface-container-low rounded-xl overflow-hidden flex items-stretch transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ${isAvailable ? 'active:scale-[0.98] cursor-pointer' : 'opacity-75 cursor-not-allowed'}`}
    >
      {/* Lab Image or Gradient Fallback */}
      <div className="relative w-1/3 aspect-[4/3] overflow-hidden flex-shrink-0">
        {lab.labImageUrl ? (
          <img 
            src={lab.labImageUrl} 
            alt={lab.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
            <MapPin className="w-8 h-8 text-white opacity-70" />
          </div>
        )}
        {/* Status Badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm ${
          isAvailable ? 'bg-secondary/90' : 'bg-tertiary-fixed-dim/90'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-white' : 'bg-on-tertiary-fixed'}`}></span>
          <span className={`text-[10px] font-bold ${isAvailable ? 'text-white' : 'text-on-tertiary-fixed'}`}>
            {isAvailable ? '可预约' : '暂停中'}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div className="space-y-2">
          <h3 className="text-on-surface font-headline font-bold text-base leading-tight truncate">
            {lab.name}
          </h3>
          <div className="space-y-1">
            {lab.managerName && (
              <p className="text-on-surface-variant text-xs flex items-center gap-2 truncate">
                <Users className="w-3 h-3 text-primary flex-shrink-0" />
                负责人：{lab.managerName}
              </p>
            )}
            <p className="text-on-surface-variant text-[11px] flex items-center gap-2">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              共 {lab.totalSeats} 个座位
            </p>
          </div>
          {!isAvailable && lab.offlineReason && (
            <div className="flex items-start gap-1.5 bg-tertiary-fixed-dim/20 rounded-lg p-2 mt-1">
              <AlertCircle className="w-3 h-3 text-tertiary flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-tertiary leading-tight">{lab.offlineReason}</p>
            </div>
          )}
        </div>
        
        {isAvailable && (
          <div className="flex justify-end pt-2">
            <span className="text-primary font-bold text-xs flex items-center gap-1">
              查看座位
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
