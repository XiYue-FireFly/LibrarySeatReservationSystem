import React from 'react';
import { Calendar, Armchair, ChevronRight, X, Scan } from 'lucide-react';
import { ApiBookRecord } from '../types';

interface AppointmentCardProps {
  record: ApiBookRecord;
  onCancel?: (bookId: number) => void;
  onViewDetails?: (record: ApiBookRecord) => void;
  onScan?: (record: ApiBookRecord) => void;
}

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: '待签到',  color: 'text-primary',   bg: 'bg-primary/10' },
  CHECKED_IN: { label: '已签到',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  FINISHED:   { label: '已结束',  color: 'text-outline',   bg: 'bg-surface-container-high' },
  EXPIRED:    { label: '已违纪',  color: 'text-red-600',   bg: 'bg-red-50' },
  CANCELLED:  { label: '已取消',  color: 'text-red-400',   bg: 'bg-red-50' },
};

function formatTime(isoStr: string): string {
  if (!isoStr) return '';
  // 支持 "2026-03-22T14:00:00" 或 "2026-03-22 14:00:00"
  return isoStr.replace('T', ' ').slice(0, 16);
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ record, onCancel, onViewDetails, onScan }) => {
  const statusInfo = STATUS_INFO[record.status] ?? STATUS_INFO.FINISHED;
  const borderColor = record.status === 'PENDING' ? 'border-primary' : record.status === 'CHECKED_IN' ? 'border-emerald-500' : 'border-outline-variant/40';

  const startFormatted = formatTime(record.bookStartTime);
  const endFormatted = formatTime(record.bookEndTime);
  const datePart = startFormatted.slice(0, 10);
  const startTime = startFormatted.slice(11, 16);
  const endTime = endFormatted.slice(11, 16);

  return (
    <div className={`group bg-surface-container-lowest border-l-4 ${borderColor} rounded-2xl p-5 shadow-[0_12px_32px_rgba(25,28,35,0.04)] relative`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-headline font-bold text-base text-on-surface truncate">
            {record.labName ?? `实验室 #${record.labId}`}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-on-surface-variant">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs font-medium">{datePart} {startTime} - {endTime}</span>
          </div>
        </div>
        <span className={`px-3 py-1 ${statusInfo.bg} ${statusInfo.color} text-[10px] font-extrabold rounded-full tracking-wider uppercase ml-2 flex-shrink-0`}>
          {statusInfo.label}
        </span>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-surface-container/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center">
            <Armchair className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">座位号</p>
            <p className="text-sm font-bold text-on-surface">{record.seatNo ?? `#${record.seatId}`}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onScan && (record.status?.trim().toUpperCase() === 'PENDING' || record.status?.trim().toUpperCase() === 'CHECKED_IN') && (
            <button
              onClick={() => onScan(record)}
              className="flex items-center gap-1 px-3 py-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Scan className="w-3.5 h-3.5" />
              {record.status?.trim().toUpperCase() === 'PENDING' ? '扫码签到' : '扫码签退'}
            </button>
          )}
          {onCancel && record.status === 'PENDING' && (
            <button
              onClick={() => onCancel(record.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors active:scale-95"
            >
              <X className="w-3 h-3" />
              取消
            </button>
          )}
          <button 
            onClick={() => onViewDetails && onViewDetails(record)}
            className="text-primary text-sm font-bold flex items-center gap-1 active:scale-95 transition-transform"
          >
            详情
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
