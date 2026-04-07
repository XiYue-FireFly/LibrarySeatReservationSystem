import React, { useState, useEffect } from 'react';
import { Search, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { LabCard } from '../components/LabCard';
import { getLabList } from '../api/lab';
import { ApiLab } from '../types';

export const LabList: React.FC = () => {
  const [labs, setLabs] = useState<ApiLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLabs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLabList();
      setLabs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取实验室列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  return (
    <div className="bg-surface min-h-screen pb-32">
      <Header title="实验室预约" showBack={false} />
      
      <div className="fixed top-4 right-6 z-[60]">
        <button className="text-primary p-2">
          <Search className="w-6 h-6" />
        </button>
      </div>

      <main className="pt-24 px-6 space-y-8">
        <div className="space-y-1">
          <p className="text-primary font-headline text-[0.75rem] font-semibold uppercase tracking-widest">Available Labs</p>
          <h2 className="text-on-surface font-headline font-extrabold text-2xl tracking-tight">实验室资源</h2>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface-container-low rounded-xl overflow-hidden flex items-stretch h-28 animate-pulse">
                <div className="w-1/3 bg-surface-container-high" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                  <div className="h-3 bg-surface-container-high rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <WifiOff className="w-12 h-12 text-outline opacity-40" />
            <p className="text-on-surface-variant font-medium">{error}</p>
            <button
              onClick={fetchLabs}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold text-sm active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        )}

        {!loading && !error && labs.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <Wifi className="w-12 h-12 text-outline opacity-40" />
            <p className="text-on-surface-variant">暂无实验室数据</p>
          </div>
        )}

        {!loading && !error && labs.length > 0 && (
          <div className="grid grid-cols-1 gap-6">
            {labs.map(lab => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};
