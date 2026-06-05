import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { ChevronDown, Info, Clock, AlertCircle, RefreshCw, User, ShieldAlert, IdCard, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSeatList } from '../api/lab';
import { createBook } from '../api/user';
import { useAuth } from '../store/auth';
import { ApiSeat, SeatListData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

/** 格式化日期：YYYY-MM-DD */
function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 格式化时间：HH:mm */
function formatTime(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const Reservation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  const [seatData, setSeatData] = useState<SeatListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [occupantSeat, setOccupantSeat] = useState<ApiSeat | null>(null);

  // --- Optimized Time States ---
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [selectedStartTime, setSelectedStartTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(120); // Default 2 hours

  // --- Generate Options ---
  const dates = Array.from({ length: (userInfo?.bookAheadDays ?? 7) + 1 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      full: formatDate(d),
      day: d.getDate(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][d.getDay()],
      isToday: i === 0
    };
  });

  const availableStartTimes = (() => {
    const times: string[] = [];
    const now = new Date();
    const isToday = selectedDate === formatDate(now);
    
    for (let h = 8; h <= 19; h++) {
      for (let m of [0, 30]) {
        if (h === 19 && m > 30) continue; // 19:30 is the last allowed start time
        if (isToday) {
          if (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes())) continue;
        }
        times.push(formatTime(h, m));
      }
    }
    return times;
  })();

  // Calculate End Time
  const calculatedEndTimeStr = (() => {
    if (!selectedStartTime) return '';
    const [h, m] = selectedStartTime.split(':').map(Number);
    let endM = m + selectedDuration;
    let endH = h + Math.floor(endM / 60);
    endM = endM % 60;

    // Cap at 20:00
    if (endH >= 20) {
      return '20:00';
    }
    return formatTime(endH, endM);
  })();

  const isDurationCapped = (() => {
    if (!selectedStartTime) return false;
    const [h, m] = selectedStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + selectedDuration;
    return endMinutes > 20 * 60;
  })();

  const fetchSeats = useCallback(async () => {
    if (!id || !selectedStartTime) return;
    setLoading(true);
    setError('');
    try {
      const startStr = `${selectedDate} ${selectedStartTime || '08:00'}:00`;
      const endStr = `${selectedDate} ${calculatedEndTimeStr || '10:00'}:00`;
      const data = await getSeatList(Number(id), startStr, endStr);
      if (!data || !data.seats) throw new Error('返回的座位数据异常');
      setSeatData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取座位信息失败');
    } finally {
      setLoading(false);
    }
  }, [id, selectedDate, selectedStartTime, calculatedEndTimeStr]);

  useEffect(() => {
    if (availableStartTimes.length > 0 && !selectedStartTime) {
      setSelectedStartTime(availableStartTimes[0]);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchSeats();
    setSelectedSeatId(null);
  }, [id, selectedDate, selectedStartTime, calculatedEndTimeStr]);

  const handleReserve = async () => {
    if (!selectedSeatId || !selectedStartTime || !seatData) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const startStr = `${selectedDate} ${selectedStartTime}:00`;
      const endStr = `${selectedDate} ${calculatedEndTimeStr}:00`;
      
      await createBook([{
        labId: seatData.labId,
        seatId: selectedSeatId,
        bookStartTime: startStr,
        bookEndTime: endStr,
      }]);
      const seat = seatData.seats.find(s => s.id === selectedSeatId);
      navigate('/success', {
        state: {
          labName: seatData.labName,
          labId: seatData.labId,
          seatNo: seat?.seatNo ?? '',
          seatId: selectedSeatId,
          bookStartTime: startStr.slice(0, 16),
          bookEndTime: endStr.slice(0, 16),
        }
      });
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : '预约失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeatStyle = (seat: ApiSeat) => {
    if (seat.status === 'MAINTENANCE') return 'bg-surface-container-high opacity-40 cursor-not-allowed';
    if (seat.status === 'BOOKED') return 'bg-tertiary-fixed-dim/20 cursor-not-allowed overflow-hidden';
    if (selectedSeatId === seat.id) return 'bg-primary/10 border-2 border-primary text-primary';
    return 'bg-secondary text-white';
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-40">
      <Header title={seatData?.labName ?? '实验室预约'} rightAction="more" />
      
      <main className="px-6 pt-24 space-y-8 max-w-md mx-auto pb-10">
        {/* Optimized Time Selection UI */}
        <section className="space-y-6">
          {/* 1. Date Strip */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
              <span className="w-1 h-3 bg-primary rounded-full"></span>
              选择日期
            </label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
              {dates.map((d) => (
                <button
                  key={d.full}
                  onClick={() => setSelectedDate(d.full)}
                  className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all ${
                    selectedDate === d.full 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-70">{d.weekday}</span>
                  <span className="text-xl font-headline font-black">{d.day}</span>
                  {d.isToday && <span className="text-[8px] font-bold">今日</span>}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Start Time & Duration */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <Clock className="w-3 h-3" /> 开始时间
              </label>
              <div className="relative group">
                <select 
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-4 font-headline font-extrabold text-primary appearance-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {availableStartTimes.length > 0 ? (
                    availableStartTimes.map(t => <option key={t} value={t}>{t}</option>)
                  ) : (
                    <option disabled>已闭馆</option>
                  )}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-primary tracking-widest uppercase flex items-center gap-2">
                <Clock className="w-3 h-3" /> 预约时长
              </label>
              <div className="flex gap-2">
                {[30, 60, 90, 120].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setSelectedDuration(mins)}
                    className={`flex-1 h-12 rounded-xl text-[10px] font-black transition-all ${
                      selectedDuration === mins 
                      ? 'bg-primary text-white shadow-md' 
                      : 'bg-surface-container-low text-on-surface'
                    }`}
                  >
                    {mins >= 60 ? `${mins/60}h` : `${mins}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* End Time Preview */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
            isDurationCapped ? 'bg-amber-50 border-amber-200' : 'bg-primary/5 border-primary/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDurationCapped ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                <Info className={`w-4 h-4 ${isDurationCapped ? 'text-amber-600' : 'text-primary'}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-outline uppercase tracking-wider">自动计算结束时间</p>
                <p className={`font-headline font-black text-lg ${isDurationCapped ? 'text-amber-700' : 'text-primary'}`}>
                  {selectedStartTime} → {calculatedEndTimeStr}
                </p>
              </div>
            </div>
            {isDurationCapped && (
              <span className="text-[8px] bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold">闭馆截断</span>
            )}
          </div>
        </section>

        {loading && (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-[10px] font-bold">获取座位状态...</p>
          </div>
        )}

        {!loading && availableStartTimes.length === 0 && (
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <ShieldAlert className="w-10 h-10 text-outline opacity-30" />
            <p className="text-on-surface-variant text-sm font-bold">该日期已过营业时间<br/>请选择明天或以后</p>
          </div>
        )}

        {!loading && (availableStartTimes.length > 0 || !error) && seatData && (
          <>
            {/* Seat Map */}
            <section className="bg-surface-container-lowest rounded-[32px] p-6 shadow-xl shadow-black/5 border border-outline-variant/10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="font-headline font-black text-xl tracking-tight text-on-surface">选择座位</h2>
                  <p className="text-[10px] text-outline font-bold uppercase tracking-widest">{seatData.labName} · {seatData.totalSeats} SEATS</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary"></div>
                  <div className="w-2 h-2 rounded-full bg-tertiary-fixed-dim/40"></div>
                  <div className="w-2 h-2 rounded-full bg-surface-container-high"></div>
                </div>
              </div>

              <div className={`grid gap-2.5 mb-2`} style={{ gridTemplateColumns: `repeat(${seatData.cols || 5}, minmax(0, 1fr))` }}>
                {seatData.seats.map(seat => (
                  <button
                    key={seat.id}
                    disabled={seat.status === 'MAINTENANCE'}
                    onClick={() => {
                      if (seat.status === 'FREE') setSelectedSeatId(seat.id);
                      else if (seat.status === 'BOOKED') setOccupantSeat(seat);
                    }}
                    className={`aspect-square rounded-xl font-headline font-black transition-all active:scale-95 text-[10px] relative overflow-hidden ${getSeatStyle(seat)}`}
                  >
                    {selectedSeatId === seat.id && (
                      <motion.div layoutId="selection" className="absolute inset-0 border-2 border-primary z-20 pointer-events-none rounded-xl" />
                    )}
                    {seat.status === 'BOOKED' && seat.userAvatar ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img src={seat.userAvatar} className="w-full h-full object-cover" alt="avatar" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">{seat.bookerName?.slice(0, 1) || '👤'}</span>
                        </div>
                      </div>
                    ) : (
                      seat.seatNo
                    )}
                  </button>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-3xl space-y-1">
                <span className="text-[8px] text-outline font-black uppercase tracking-widest block">负责人</span>
                <p className="font-headline font-bold text-on-surface text-sm">{ (seatData as any).managerName ?? '—'}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-3xl space-y-1">
                <span className="text-[8px] text-outline font-black uppercase tracking-widest block">实验室邮箱</span>
                <p className="font-headline font-bold text-on-surface text-[10px] truncate">{ (seatData as any).managerEmail ?? '—'}</p>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-3 text-[11px] font-bold text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {submitError}
              </div>
            )}
          </>
        )}
      </main>

      <AnimatePresence>
        {occupantSeat && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
              onClick={() => setOccupantSeat(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-surface/90 backdrop-blur-2xl text-on-surface rounded-[32px] overflow-hidden shadow-[0_32px_64px_rgba(0,0,0,0.2)] z-10 border border-white/20 p-8"
            >
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/30 to-tertiary/10 blur-2xl -z-10"></div>
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary to-tertiary">
                    <img 
                      src={occupantSeat.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${occupantSeat.bookerAccount ?? 'user'}`}
                      alt="User Avatar"
                      className="w-full h-full rounded-full object-cover border-4 border-surface"
                    />
                  </div>
                  <div className="absolute -bottom-2 right-0 bg-emerald-500 rounded-full p-1 ring-4 ring-surface">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                <h3 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight mb-1">
                  {occupantSeat.bookerName ?? '神秘同学'}
                </h3>
                <p className="flex items-center gap-1.5 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
                  <IdCard className="w-4 h-4" />
                  {occupantSeat.bookerAccount ?? '学号已隐藏'}
                </p>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-highest/50 border border-outline-variant/10">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-outline-variant" />
                      <span className="text-sm font-bold text-on-surface-variant">开始使用</span>
                    </div>
                    <span className="font-headline font-bold text-on-surface">{occupantSeat.bookStartTime ?? '—'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-highest/50 border border-outline-variant/10">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-outline-variant" />
                      <span className="text-sm font-bold text-on-surface-variant">预计离开</span>
                    </div>
                    <span className="font-headline font-bold text-on-surface">{occupantSeat.bookEndTime ?? '—'}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setOccupantSeat(null)}
                  className="w-full mt-8 bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-4 rounded-2xl font-extrabold transition-all active:scale-[0.98]"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Action */}
      {!loading && !error && seatData && (
        <div className="fixed bottom-0 left-0 w-full p-6 bg-surface/90 backdrop-blur-xl z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <div className="max-w-md mx-auto">
            <button 
              onClick={handleReserve}
              disabled={!selectedSeatId || !selectedStartTime || submitting}
              className="w-full bg-gradient-to-b from-primary to-primary-container text-on-primary py-4 rounded-xl font-headline font-extrabold text-lg tracking-tight shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '预约中...' : !selectedSeatId ? '请先选择座位' : !selectedStartTime ? '请先选择时间' : '立即预约'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
