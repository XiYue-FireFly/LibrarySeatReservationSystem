import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { Bell, Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { getNotifications, markAsRead } from '../api/user';
import { ApiNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ERROR': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'WARNING': return <Info className="w-5 h-5 text-amber-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-24">
      <Header title="消息中心" showBack={true} />
      
      <main className="pt-20 px-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <Bell className="w-16 h-16 mb-4" />
            <p>暂无系统通知</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notice, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={notice.id}
                  onClick={() => handleRead(notice.id)}
                  className={`relative p-4 rounded-3xl border transition-all ${
                    notice.isRead 
                      ? 'bg-surface-container-low border-outline-variant/30 opacity-70' 
                      : 'bg-white border-primary/20 shadow-md ring-1 ring-primary/5'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      notice.isRead ? 'bg-outline-variant/10' : 'bg-primary/5'
                    }`}>
                      {getIcon(notice.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-bold ${notice.isRead ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                          {notice.title}
                        </h4>
                        <span className="text-[10px] text-outline font-medium">
                          {notice.createTime?.replace('T', ' ').slice(5, 16)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant leading-relaxed">
                        {notice.content}
                      </p>
                    </div>
                  </div>
                  {!notice.isRead && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-pulse shadow-sm shadow-primary"></div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};
