import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Microscope, Armchair, Clock, ArrowRight, CalendarDays } from 'lucide-react';
import { motion } from 'motion/react';

interface SuccessState {
  labName: string;
  labId: number;
  seatNo: string;
  seatId: number;
  bookStartTime: string;
  bookEndTime: string;
}

export const Success: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as SuccessState | null;

  if (!state) {
    navigate('/labs');
    return null;
  }

  const { labName, seatNo, bookStartTime, bookEndTime } = state;
  // 提取日期
  const datePart = bookStartTime.slice(0, 10).replace(/-/g, '年').replace(/(\d{4})年(\d{2})年(\d{2})/, '$1年$2月$3日');
  const startTime = bookStartTime.slice(11, 16);
  const endTime = bookEndTime.slice(11, 16) || (String(parseInt(startTime.slice(0,2)) + 2).padStart(2,'0') + ':00');

  return (
    <div className="bg-surface font-sans text-on-surface min-h-screen flex items-center justify-center p-6">
      <div className="fixed inset-0 bg-on-surface/10 backdrop-blur-sm z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-surface-container-lowest rounded-[32px] overflow-hidden shadow-[0_24px_48px_rgba(0,91,191,0.08)] flex flex-col items-center pt-12 pb-8 px-8 z-10"
      >
        {/* Success Icon */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-secondary-container/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20">
              <CheckCircle2 className="w-10 h-10 text-white fill-white/20" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-tertiary-fixed-dim"></div>
          <div className="absolute bottom-4 -left-4 w-4 h-4 rounded-full bg-secondary-fixed-dim"></div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl font-headline font-bold text-on-surface tracking-tight">恭喜您，预约成功！</h2>
          <p className="text-on-surface-variant text-sm font-medium tracking-wide">您的席位已锁定，请准时到达实验室</p>
        </div>

        {/* Booking Details */}
        <div className="w-full bg-surface-container-low rounded-2xl p-6 space-y-6 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
          
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center flex-shrink-0">
              <Microscope className="text-primary w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">实验室</span>
              <span className="text-base font-semibold text-on-surface">{labName}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                <Armchair className="text-primary w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">座位号</span>
                <span className="text-base font-semibold text-on-surface">{seatNo}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center flex-shrink-0">
                <Clock className="text-primary w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">时间段</span>
                <span className="text-sm font-semibold text-on-surface">{startTime} - {endTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center flex-shrink-0">
              <CalendarDays className="text-primary w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-0.5">预约日期</span>
              <span className="text-sm font-semibold text-on-surface">{bookStartTime.slice(0,10)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex justify-end">
            <span className="px-2 py-1 bg-secondary-container/50 text-on-secondary-container text-[10px] font-bold rounded-lg uppercase">已确认</span>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => navigate('/labs')}
          className="group w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>返回列表</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="mt-6 text-xs text-outline font-medium">可在个人中心查看预约记录</p>
      </motion.div>

      {/* Decorative Background */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[100px]"></div>
      </div>
    </div>
  );
};
