import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { AppointmentCard } from '../components/AppointmentCard';
import { IdCard, Edit, LogOut, RefreshCw, WifiOff, MessageSquareQuote, MapPin, Clock, Calendar, CheckCircle, AlertTriangle, Scan, X, Shield } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { http } from '../api/request';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { getMyBookList, cancelBook, verifyQRToken } from '../api/user';
import { ApiBookRecord } from '../types';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'all' | 'ongoing' | 'history';

const STATUS_LABEL: Record<string, string> = {
  PENDING: '待签到',
  CHECKED_IN: '已签到',
  FINISHED: '已结束',
  CANCELLED: '已取消',
};

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ongoing');
  const navigate = useNavigate();
  const { userInfo, logout } = useAuth();

  const [bookRecords, setBookRecords] = useState<ApiBookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState<ApiBookRecord | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [currentScanRecord, setCurrentScanRecord] = useState<ApiBookRecord | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyBookList();
      setBookRecords(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取预约记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCancel = async (bookId: number) => {
    try {
      await cancelBook([bookId]);
      // 乐观更新
      setBookRecords(prev => prev.map(r => r.id === bookId ? { ...r, status: 'CANCELLED' } : r));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '取消失败');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const startScanner = (record: ApiBookRecord) => {
    setCurrentScanRecord(record);
    setScanning(true);
    // We will initialize the scanner in a useEffect or after a small delay to ensure the container is ready
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
      });
      const qrCodeSuccessCallback = async (decodedText: string) => {
        try {
          html5QrCode.stop().then(async () => {
            setScanning(false);
            setScanLoading(true);
            try {
              const cleanedText = decodedText.trim();
              let data: any = null;

              // 1. Try New Pipe Protocol (High Reliability)
              if (cleanedText.includes('|')) {
                const parts = cleanedText.split('|');
                if (parts.length === 3) {
                  data = { 
                    token: parts[0].replace(/[\s"']/g, ''), 
                    bookingId: parts[1].replace(/[\s"']/g, ''), 
                    type: parts[2].replace(/[\s"']/g, '') 
                  };
                }
              }

              // 2. Try REGEX extraction (Legacy or Broken JSON/OCR)
              if (!data) {
                // Ignore quotes, braces, brackets, spaces. Just look for key-value pairs.
                // Tolerates "Id", "ld", "ID", "id"
                // The group [^",|} \t\n]+ ensures we stop at separators and don't include them
                const tokenMatch = cleanedText.match(/token"??\s*[:：]\s*"??([^",|} \t\n]+)"??/i);
                const idMatch = cleanedText.match(/booking[iI1l]d"??\s*[:：]\s*"??([^",|} \t\n]+)"??/i);
                const typeMatch = cleanedText.match(/type"??\s*[:：]\s*"??([^",|} \t\n]+)"??/i);
                
                if (tokenMatch && idMatch && typeMatch) {
                  data = {
                    token: tokenMatch[1].replace(/[\s"']/g, ''),
                    bookingId: idMatch[1].replace(/[\s"']/g, ''),
                    type: typeMatch[1].replace(/[\s"']/g, '')
                  };
                }
              }

              // 3. Final Validation & Request
              if (data && data.token && data.bookingId && data.type) {
                const normalizedData = {
                   token: data.token,
                   bookingId: data.bookingId,
                   type: data.type.toUpperCase()
                };

                // Move API call outside of current try-catch if possible, 
                // OR use a separate try-catch to differentiate Errors
                try {
                  const res: any = await verifyQRToken(normalizedData);
                  alert('🎉 签到/签退成功！');
                  fetchBooks();
                  setScanning(false);
                } catch (apiErr: any) {
                  alert('验证失败：' + (apiErr.message || '服务器响应异常'));
                }
              } else {
                alert('无法识别二维码内容！\n\n识别文本:\n' + cleanedText);
              }
            } catch (e) {
              alert('扫码解析异常，请重试');
              console.error(e);
            } finally {
              setScanLoading(false);
            }
          }).catch(err => {
            console.error(err);
            setScanning(false);
          });
        } catch (e) {
          console.error(e);
        }
      };
      
      const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.7);
        return {
          width: qrboxSize,
          height: qrboxSize
        };
      };
      const config = { fps: 10, qrbox: qrboxFunction };
      html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, (errorMessage) => {
        // console.warn(errorMessage);
      })
        .catch(err => {
          alert("开启摄像头失败，请检查权限 (请确保在 HTTPS 下运行)");
          setScanning(false);
        });
    }, 100);
  };

  const filteredRecords = bookRecords.filter(r => {
    if (activeTab === 'all') return true;
    if (activeTab === 'ongoing') return r.status === 'PENDING' || r.status === 'CHECKED_IN';
    return r.status === 'FINISHED' || r.status === 'CANCELLED';
  });

  const displayName = userInfo?.userName || userInfo?.name || '用户';
  const avatarUrl = userInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo?.account ?? 'default'}`;

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <Header title="个人中心" showBack={false} rightAction="bell" />
      
      <main className="pt-24 px-6 space-y-8">
        {/* Punishment Notice */}
        {userInfo?.punishStatus && userInfo?.punishEndTime && (
          <motion.section 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200 rounded-3xl p-5 flex items-center gap-4 shadow-sm"
          >
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-red-800 font-bold text-sm">账户处于封禁中</h3>
              <p className="text-red-600 text-[11px] leading-snug mt-1">
                违纪次数：{userInfo.violationCount} 次<br/>
                预计解封：{userInfo.punishEndTime.replace('T', ' ').slice(0, 16)}
              </p>
            </div>
          </motion.section>
        )}

        {/* Admin Debug Info (Only for development/admin check) */}
        {(userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN' || String(userInfo?.role).toUpperCase() === 'ADMIN') && (
          <div className="bg-slate-800 text-white/50 text-[8px] p-2 rounded-lg font-mono truncate">
            DEBUG: ID={userInfo.id} ROLE={userInfo.role}
          </div>
        )}

        {/* Admin Portal Entry */}
        {(userInfo?.role === 'ADMIN' || userInfo?.role === 'SUPER_ADMIN' || String(userInfo?.role).toUpperCase() === 'ADMIN') && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600 rounded-3xl p-6 shadow-lg shadow-indigo-200 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">管理员工作台</h3>
                <p className="text-white/70 text-xs mt-0.5">管理预约、生成签到码</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/admin-portal')}
              className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
            >
              进入
            </button>
          </motion.section>
        )}

        {/* Profile Card */}
        <section className="relative overflow-hidden rounded-3xl bg-surface-container-low p-6 shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <img 
                  src={avatarUrl}
                  alt="Profile" 
                  className="w-20 h-20 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                />
                <div className="absolute -bottom-1 -right-1 bg-secondary w-5 h-5 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">{displayName}</h2>
                <p className="text-on-surface-variant font-medium text-sm mt-1 flex items-center gap-1">
                  <IdCard className="w-3.5 h-3.5" />
                  {userInfo?.account ?? '—'}
                </p>
                <p className="text-xs text-outline mt-1">
                  真实姓名：{userInfo?.name ?? '—'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-outline hover:text-red-500 transition-colors p-2"
              title="退出登录"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-6 flex gap-3">
            <button 
              onClick={() => navigate('/edit-profile')}
              className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-semibold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              修改信息
            </button>
            <button 
              onClick={() => navigate('/feedback')}
              className="flex-1 bg-surface-container-high text-on-surface py-3 rounded-xl font-semibold text-sm shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-outline-variant/30 hover:border-primary/50"
            >
              <MessageSquareQuote className="w-4 h-4" />
              意见反馈
            </button>
          </div>
        </section>

        {/* Tabs */}
        <nav className="flex p-1.5 bg-surface-container-high rounded-2xl">
          {(['all', 'ongoing', 'history'] as TabType[]).map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                activeTab === tab ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:bg-white/50'
              }`}
            >
              {tab === 'all' ? '全部' : tab === 'ongoing' ? '进行中' : '历史'}
            </button>
          ))}
        </nav>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline font-bold text-lg text-on-surface">预约记录</h3>
            <button onClick={fetchBooks} className="text-primary p-1">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <div key={i} className="h-24 bg-surface-container-low rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center py-12 gap-3 text-center">
              <WifiOff className="w-10 h-10 text-outline opacity-40" />
              <p className="text-on-surface-variant text-sm">{error}</p>
              <button onClick={fetchBooks} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold">重试</button>
            </div>
          )}

          {!loading && !error && filteredRecords.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant opacity-60">
              暂无相关预约记录
            </div>
          )}

          {!loading && !error && filteredRecords.map(record => (
            <AppointmentCard 
              key={record.id} 
              record={record}
              onCancel={record.status === 'PENDING' ? handleCancel : undefined}
              onViewDetails={setSelectedBook}
              onScan={startScanner}
            />
          ))}
        </div>
      </main>

      {/* 预约详情高斯模糊弹窗 */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedBook(null)}
            />
            <motion.div 
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-surface text-on-surface rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl z-10 p-6 pb-12 sm:pb-6"
            >
              <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-headline font-extrabold text-xl text-on-surface tracking-tight">预约详情</h3>
                  <p className="text-xs text-outline font-medium">编号: {selectedBook.id}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[10px] text-outline uppercase font-bold tracking-wider">地点 & 座位</p>
                    <p className="font-bold text-sm text-on-surface">{selectedBook.labName ?? `实验室 #${selectedBook.labId}`} · {selectedBook.seatNo ?? `${selectedBook.seatId}号座位`}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[10px] text-outline uppercase font-bold tracking-wider">日期与状态</p>
                    <p className="font-bold text-sm text-on-surface">创建于: {selectedBook.createTime?.replace('T', ' ').slice(0, 16) ?? '—'}</p>
                    <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded min-w-[50px] text-center" style={{ backgroundColor: STATUS_LABEL[selectedBook.status] === '已结束' || STATUS_LABEL[selectedBook.status] === '已取消' ? '#f1f5f9' : '#e0e7ff', color: STATUS_LABEL[selectedBook.status] === '已结束' || STATUS_LABEL[selectedBook.status] === '已取消' ? '#64748b' : '#4f46e5' }}>{STATUS_LABEL[selectedBook.status] ?? selectedBook.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/20 shadow-sm">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-[10px] text-outline uppercase font-bold tracking-wider">预约时间段</p>
                    <p className="font-bold text-sm text-on-surface">{selectedBook.bookStartTime?.replace('T', ' ').slice(0, 16)} 至 {selectedBook.bookEndTime?.replace('T', ' ').slice(11, 16)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={() => setSelectedBook(null)}
                  className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface py-3.5 rounded-xl font-bold transition-colors active:scale-[0.98]"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Scanner Overlay */}
      <AnimatePresence>
        {scanning && (
          <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black">
            <div className="absolute top-10 right-6 z-[210]">
              <button 
                onClick={() => {
                  setScanning(false);
                  // Manually stop if user closes
                  window.location.reload(); // Simple way to clean up camera if stopped via UI
                }}
                className="p-3 bg-white/20 rounded-full backdrop-blur-md text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center mb-8 px-6">
              <h3 className="text-white text-xl font-bold">请对准签到二维码</h3>
              <p className="text-white/60 text-sm mt-2">操作对象：{currentScanRecord?.labName} - {currentScanRecord?.seatNo}</p>
            </div>

            <div id="reader" className="w-[300px] h-[300px] overflow-hidden rounded-3xl border-2 border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.5)]"></div>
            
            <div className="mt-12 text-white/40 text-xs flex items-center gap-2">
              <Scan className="w-4 h-4 animate-pulse" />
              扫描管理员提供的动态二维码进行确认
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* global loading for verification */}
      {scanLoading && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            <p className="font-bold text-primary">正在验证中...</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
