import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { ChevronDown, Info, Clock, AlertCircle, RefreshCw, User, ShieldAlert, IdCard, CheckCircle2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSeatList } from '../api/lab';
import { createBook } from '../api/user';
import { useAuth } from '../store/auth';
import { ApiSeat, SeatListData } from '../types';
import { motion, AnimatePresence } from 'motion/react';

/** 生成未来 N 天内的时间段（每2小时一个，09:00~21:00） */
function generateTimeSlots(bookAheadDays: number): string[] {
  const slots: string[] = [];
  const now = new Date();
  for (let d = 0; d <= bookAheadDays; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    for (let h = 8; h <= 20; h += 2) {
      if (d === 0 && h <= now.getHours()) continue; // 跳过已过时段
      const startHour = String(h).padStart(2, '0');
      slots.push(`${dateStr} ${startHour}:00`);
    }
  }
  return slots.slice(0, 20); // 最多展示20个时段
}

/** 格式化为后端要求的 datetime 字符串 */
function toBackendTime(slotStr: string, extra2h = false): string {
  const [datePart, timePart] = slotStr.split(' ');
  const [h, m] = timePart.split(':').map(Number);
  const newH = extra2h ? h + 2 : h;
  return `${datePart} ${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

export const Reservation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userInfo } = useAuth();

  const [seatData, setSeatData] = useState<SeatListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSeatId, setSelectedSeatId] = useState<number | null>(null);
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [occupantSeat, setOccupantSeat] = useState<ApiSeat | null>(null);

  const timeSlots = generateTimeSlots(userInfo?.bookAheadDays ?? 7);

  const fetchSeats = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await getSeatList(Number(id));
      setSeatData(data);
      if (!selectedTime && timeSlots.length > 0) {
        setSelectedTime(timeSlots[0]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取座位信息失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const handleReserve = async () => {
    if (!selectedSeatId || !selectedTime || !seatData) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      await createBook([{
        labId: seatData.labId,
        seatId: selectedSeatId,
        bookStartTime: toBackendTime(selectedTime),
        bookEndTime: toBackendTime(selectedTime, true),
      }]);
      const seat = seatData.seats.find(s => s.id === selectedSeatId);
      navigate('/success', {
        state: {
          labName: seatData.labName,
          labId: seatData.labId,
          seatNo: seat?.seatNo ?? '',
          seatId: selectedSeatId,
          bookStartTime: selectedTime,
          bookEndTime: toBackendTime(selectedTime, true).slice(0, 16),
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
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <Header title={seatData?.labName ?? '实验室预约'} rightAction="more" />
      
      <main className="px-6 pt-24 space-y-8 max-w-md mx-auto">
        {loading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-on-surface-variant text-sm">加载座位信息...</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-outline opacity-40" />
            <p className="text-on-surface-variant">{error}</p>
            <button onClick={fetchSeats} className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm">
              <RefreshCw className="w-4 h-4" /> 重试
            </button>
          </div>
        )}

        {!loading && !error && seatData && (
          <>
            {/* Time Selection */}
            <section className="space-y-3">
              <label className="font-headline font-bold text-on-surface-variant text-sm tracking-widest uppercase flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                预约开始时间
              </label>
              <div className="relative">
                <div 
                  onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between cursor-pointer border-b-2 border-transparent hover:border-primary/30 transition-all"
                >
                  <span className="font-headline font-bold text-lg text-primary">{selectedTime || '选择时间'}</span>
                  <motion.div animate={{ rotate: isTimeDropdownOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-6 h-6 text-primary" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {isTimeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 4, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-full left-0 w-full z-[70] mt-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden academic-shadow max-h-64 overflow-y-auto"
                    >
                      <div className="p-2 grid grid-cols-1 gap-1">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => { setSelectedTime(time); setIsTimeDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center gap-3 ${
                              selectedTime === time ? 'bg-primary text-white' : 'hover:bg-primary/10 text-on-surface'
                            }`}
                          >
                            <Clock className={`w-4 h-4 ${selectedTime === time ? 'text-white' : 'text-primary'}`} />
                            {time}（使用至{String(parseInt(time.slice(11,13))+2).padStart(2,'0')}:00）
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-[10px] font-medium text-outline mt-2 px-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  每次固定使用2小时，最多可提前 {userInfo?.bookAheadDays ?? 7} 天预约
                </p>
              </div>
            </section>

            {/* Seat Map */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_12px_32px_rgba(25,28,35,0.04)] border border-outline-variant/15">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">选择座位</h2>
                  <p className="text-sm text-outline font-medium">{seatData.labName}（共 {seatData.totalSeats} 个座位）</p>
                </div>
                <div className="flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-tighter">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-secondary"></div><span>空闲</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-tertiary-fixed-dim/40"></div><span>已预约</span></div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-surface-container-high opacity-50"></div><span>维护中</span></div>
                </div>
              </div>

              <div className={`grid gap-3 mb-4`} style={{ gridTemplateColumns: `repeat(${seatData.cols || 5}, minmax(0, 1fr))` }}>
                {seatData.seats.map(seat => (
                  <button
                    key={seat.id}
                    disabled={seat.status === 'MAINTENANCE'}
                    onClick={() => {
                      if (seat.status === 'FREE') setSelectedSeatId(seat.id);
                      else if (seat.status === 'BOOKED') setOccupantSeat(seat);
                    }}
                    title={seat.status === 'BOOKED' ? `${seat.bookerName ?? '已预约'} (${seat.bookStartTime}-${seat.bookEndTime})` : seat.status === 'MAINTENANCE' ? seat.maintenanceReason ?? '维护中' : seat.seatNo}
                    className={`aspect-square rounded-xl font-headline font-bold transition-all active:scale-90 text-xs overflow-hidden relative shadow-sm hover:shadow-md ${getSeatStyle(seat)}`}
                  >
                    {seat.status === 'BOOKED' && seat.userAvatar ? (
                      <div className="absolute inset-0 w-full h-full">
                        <img 
                          src={seat.userAvatar} 
                          alt="avatar" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                            (e.target as any).nextSibling.style.display = 'flex';
                            (e.target as any).nextSibling.nextSibling.style.display = 'none';
                          }}
                        />
                        <div className="hidden absolute inset-0 items-center justify-center bg-tertiary-fixed-dim/20 text-on-surface">
                          {seat.seatNo}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-center pb-1 px-0.5">
                          <span className="text-[7px] text-white font-bold truncate leading-none">{seat.bookerName || '已选'}</span>
                        </div>
                      </div>
                    ) : (
                      seat.seatNo
                    )}
                  </button>
                ))}
              </div>

              {selectedSeatId && (
                <div className="mt-2 p-3 bg-primary/5 rounded-xl text-sm text-primary font-medium">
                  已选：{seatData.seats.find(s => s.id === selectedSeatId)?.seatNo}
                </div>
              )}
            </section>

            {/* Lab Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">负责人</span>
                <p className="font-headline font-bold text-on-surface">{seatData ? (seatData as any).managerName ?? '—' : '—'}</p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-outline font-bold uppercase tracking-wider block">邮箱</span>
                <p className="font-headline font-bold text-on-surface text-xs truncate">{seatData ? (seatData as any).managerEmail ?? '—' : '—'}</p>
              </div>
            </div>

            {submitError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}
          </>
        )}
      </main>

      {/* 占座人信息高斯模糊弹窗 */}
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
              disabled={!selectedSeatId || !selectedTime || submitting}
              className="w-full bg-gradient-to-b from-primary to-primary-container text-on-primary py-4 rounded-xl font-headline font-extrabold text-lg tracking-tight shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '预约中...' : !selectedSeatId ? '请先选择座位' : !selectedTime ? '请先选择时间' : '立即预约'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
