import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Search, Filter, RefreshCw, QrCode, User, MapPin, Clock, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getAdminBookPage, getAdminQRToken } from '../api/user';
import { getAllLabs } from '../api/lab';
import { ApiBookRecord, ApiLab } from '../types';
import { QRCodeSVG } from 'qrcode.react';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: '待签到',  color: 'text-indigo-600', bg: 'bg-indigo-50' },
  CHECKED_IN: { label: '已签到',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  FINISHED:   { label: '已结束',  color: 'text-slate-500',   bg: 'bg-slate-100' },
  CANCELLED:  { label: '已取消',  color: 'text-red-400',   bg: 'bg-red-50' },
  EXPIRED:    { label: '已违纪',  color: 'text-red-600',   bg: 'bg-red-50' },
};

export const AdminPortal: React.FC = () => {
  const [records, setRecords] = useState<ApiBookRecord[]>([]);
  const [labs, setLabs] = useState<ApiLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ account: '', labId: '' as string | number });
  const [showFilters, setShowFilters] = useState(false);
  
  const [qrModal, setQrModal] = useState<{ show: boolean; value: string; type: 'IN' | 'OUT'; record: ApiBookRecord | null }>({
    show: false,
    value: '',
    type: 'IN',
    record: null
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookData, labsData] = await Promise.all([
        getAdminBookPage({ current: 1, size: 50, account: filters.account, labId: filters.labId ? Number(filters.labId) : undefined }),
        getAllLabs()
      ]);
      setRecords(bookData.records || []);
      setLabs(labsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateQR = async (record: ApiBookRecord, type: 'IN' | 'OUT') => {
    try {
      const res = await getAdminQRToken(record.id, type);
      setQrModal({
        show: true,
        value: `${res.token}|${res.bookingId}|${res.type}`,
        type,
        record
      });
    } catch (err: any) {
      alert(err.message || '获取码失败');
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <Header title="管理员工作台" showBack={true} />
      
      <main className="pt-24 px-6 space-y-6">
        {/* Search & Filter Bar */}
        <section className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text" 
                placeholder="搜索学号..." 
                value={filters.account}
                onChange={(e) => setFilters(prev => ({ ...prev, account: e.target.value }))}
                onKeyUp={(e) => e.key === 'Enter' && fetchData()}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 rounded-2xl border transition-all ${showFilters ? 'bg-primary text-white border-primary shadow-md' : 'bg-surface-container-low border-outline-variant/30 text-on-surface-variant'}`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button 
              onClick={fetchData}
              className="p-3 bg-surface-container-low border border-outline-variant/30 text-on-surface-variant rounded-2xl active:rotate-180 transition-transform duration-500"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-surface-container-high rounded-2xl p-4 flex flex-col gap-3">
                  <label className="text-xs font-bold text-outline uppercase tracking-wider">按实验室筛选</label>
                  <select 
                    value={filters.labId}
                    onChange={(e) => setFilters(prev => ({ ...prev, labId: e.target.value }))}
                    className="w-full bg-white rounded-xl py-3 px-4 text-sm border-none shadow-sm outline-none"
                  >
                    <option value="">全部实验室</option>
                    {labs.map(lab => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </select>
                  <button 
                    onClick={() => { fetchData(); setShowFilters(false); }}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm mt-2 shadow-lg"
                  >
                    应用筛选
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-lg text-on-surface flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              所有预约记录
            </h3>
            <span className="text-xs font-medium text-outline bg-surface-container-high px-2.5 py-1 rounded-full">{records.length} 条</span>
          </div>

          {loading ? (
             <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-32 bg-surface-container-low rounded-3xl animate-pulse" />
                ))}
             </div>
          ) : records.length === 0 ? (
            <div className="py-20 text-center opacity-40">暂无预约数据</div>
          ) : (
            <div className="space-y-4">
              {records.map(record => {
                const status = STATUS_MAP[record.status] || STATUS_MAP.FINISHED;
                return (
                  <motion.div 
                    layout
                    key={record.id}
                    className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/10 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">ID: {record.id}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${status.bg} ${status.color}`}>{status.label}</span>
                        </div>
                        <h4 className="font-bold text-on-surface text-base flex items-center gap-1.5">
                          <User className="w-4 h-4 text-outline" />
                          用户: {record.userId}
                        </h4>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center justify-end gap-1 text-on-surface-variant mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="text-sm font-bold">{record.seatNo || record.seatId}</span>
                         </div>
                         <p className="text-[10px] text-outline font-medium">{record.labName || `实验室 ${record.labId}`}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-outline font-bold uppercase tracking-wider">时间段</span>
                        <div className="text-xs font-bold text-on-surface">
                           {record.bookStartTime.replace('T', ' ').slice(5, 16)} 
                           <span className="text-outline mx-1">→</span>
                           {record.bookEndTime.replace('T', ' ').slice(11, 16)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {record.status === 'PENDING' && (
                          <button 
                            onClick={() => handleGenerateQR(record, 'IN')}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            签到码
                          </button>
                        )}
                        {record.status === 'CHECKED_IN' && (
                          <button 
                            onClick={() => handleGenerateQR(record, 'OUT')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-200 active:scale-95 transition-all flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            签退码
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {qrModal.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setQrModal(prev => ({...prev, show: false}))}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-8 flex flex-col items-center shadow-2xl z-10"
            >
              <div className="absolute top-6 right-6">
                 <button onClick={() => setQrModal(prev => ({...prev, show: false}))} className="p-2 bg-slate-100 rounded-full text-slate-400">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${qrModal.type === 'IN' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                 <CheckCircle className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-headline font-extrabold text-slate-900 mb-2">{qrModal.type === 'IN' ? '学生签到码' : '学生签退码'}</h3>
              <p className="text-sm text-slate-500 text-center mb-8 px-4 leading-relaxed">请学生使用图书馆 App 扫描此码确认{qrModal.type === 'IN' ? '签到入座' : '签退离开'}。<br/><span className="text-indigo-600 font-bold mt-1 inline-block">Token 五分钟内有效</span></p>

              <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-inner mb-8 transition-all hover:border-indigo-200">
                <QRCodeSVG 
                  value={qrModal.value} 
                  size={220}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="w-full space-y-3">
                 <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest px-1">
                    <span>座位号</span>
                    <span className="text-slate-900">{qrModal.record?.seatNo || qrModal.record?.seatId}</span>
                 </div>
                 <div className="h-px bg-slate-100 w-full" />
                 <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase tracking-widest px-1">
                    <span>用户ID</span>
                    <span className="text-slate-900">{qrModal.record?.userId}</span>
                 </div>
              </div>

              <button 
                onClick={() => setQrModal(prev => ({...prev, show: false}))}
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-bold text-md shadow-xl active:scale-95 transition-all"
              >
                关闭窗口
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};
