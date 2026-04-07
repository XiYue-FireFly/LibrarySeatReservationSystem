import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Send, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { submitFeedback, getMyFeedback } from '../api/feedback';
import { ApiFeedback } from '../types';
import { motion } from 'motion/react';

const TYPE_OPTIONS = [
  { value: 'SYSTEM_BUG', label: '系统Bug' },
  { value: 'FEATURE_REQUEST', label: '功能建议' },
  { value: 'LAB_ISSUE', label: '机房问题' },
  { value: 'OTHER', label: '其他' },
];

export const Feedback: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [feedbacks, setFeedbacks] = useState<ApiFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Submit Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('SYSTEM_BUG');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getMyFeedback();
      setFeedbacks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await submitFeedback({ title, content, type });
      alert('反馈提交成功！');
      setTitle('');
      setContent('');
      setActiveTab('history');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'RESOLVED': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-outline" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return '处理中';
      case 'RESOLVED': return '已解决';
      case 'REJECTED': return '已驳回';
      default: return '未知状态';
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-32">
      <Header title="意见反馈" rightAction="more" />

      <main className="pt-24 px-6 max-w-md mx-auto space-y-6">
        {/* Tabs */}
        <nav className="flex p-1.5 bg-surface-container-high rounded-2xl mb-8">
          <button 
            onClick={() => setActiveTab('submit')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'submit' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:bg-white/50'
            }`}
          >
            写反馈
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              activeTab === 'history' ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:bg-white/50'
            }`}
          >
            我的反馈
          </button>
        </nav>

        {activeTab === 'submit' ? (
          <motion.form 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">反馈类型</label>
              <div className="relative">
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-surface-container-low text-on-surface p-4 rounded-xl outline-none border border-transparent focus:border-primary/50 transition-all font-medium appearance-none"
                >
                  {TYPE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  ▼
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">标题简介</label>
              <input 
                type="text" 
                placeholder="一句话描述问题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-surface-container-low text-on-surface p-4 rounded-xl outline-none border border-transparent focus:border-primary/50 transition-all font-medium placeholder:text-outline/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">详细描述</label>
              <textarea 
                placeholder="请详细描述您遇到的问题或您的建议...(不少于10个字)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={5}
                className="w-full bg-surface-container-low text-on-surface p-4 rounded-xl outline-none border border-transparent focus:border-primary/50 transition-all resize-y font-medium placeholder:text-outline/40"
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={submitting || !title || !content}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              <Send className="w-5 h-5" />
              {submitting ? '提交中...' : '提交反馈'}
            </button>
          </motion.form>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-32 bg-surface-container-low rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant opacity-60">
                暂无历史反馈记录
              </div>
            ) : (
              feedbacks.map(fb => (
                <div key={fb.id} className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-headline font-bold text-lg leading-tight text-on-surface mr-4">{fb.title}</h3>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full absolute top-5 right-5 text-xs font-bold whitespace-nowrap">
                      {getStatusIcon(fb.status)}
                      <span className="text-on-surface-variant">{getStatusLabel(fb.status)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4 text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-lg mr-16">
                    {fb.content}
                  </div>
                  
                  {fb.adminReply && (
                    <div className="mt-4 p-4 border border-emerald-500/20 bg-emerald-50/50 rounded-xl relative">
                      <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1 tracking-widest">管理员回复</p>
                      <p className="text-sm font-medium text-emerald-900">{fb.adminReply}</p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-outline font-medium">
                    <span>{TYPE_OPTIONS.find(o => o.value === fb.type)?.label || '其他'}</span>
                    <span>{fb.createTime.replace('T', ' ').slice(0, 16)}</span>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};
