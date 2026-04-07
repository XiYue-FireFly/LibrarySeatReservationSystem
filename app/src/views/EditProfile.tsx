import React, { useState, useRef } from 'react';
import { Header } from '../components/Header';
import { IdCard, User, Camera, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { updateUserInfo, uploadAvatar } from '../api/user';

export const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo, updateUserInfo: updateCtx } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userName, setUserName] = useState(userInfo?.userName || '');
  const [avatarUrl, setAvatarUrl] = useState(userInfo?.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState(userInfo?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo?.account ?? 'default'}`);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 本地预览
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploading(true);
    setError('');
    try {
      const uploadedUrl = await uploadAvatar(file);
      setAvatarUrl(uploadedUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '上传头像失败');
      setAvatarPreview(avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo?.account ?? 'default'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload: { userName?: string; avatar?: string } = {};
      if (userName !== (userInfo?.userName || '')) payload.userName = userName;
      if (avatarUrl && avatarUrl !== userInfo?.avatar) payload.avatar = avatarUrl;
      
      if (Object.keys(payload).length > 0) {
        await updateUserInfo(payload);
        updateCtx(payload);
      }
      setSuccess(true);
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col items-center">
      <Header title="修改个人信息" />
      
      <main className="w-full max-w-md px-8 pt-24 pb-12 flex flex-col items-center">
        <div className="w-full mb-10 text-left">
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight mb-2">更新个人资料</h2>
          <p className="text-on-surface-variant opacity-80">您可以修改昵称和头像</p>
        </div>

        {/* Avatar Upload */}
        <section className="mb-12 relative group">
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
          <div 
            onClick={handleAvatarClick}
            className="w-28 h-28 rounded-full bg-surface-container-high border-2 border-dashed border-outline-variant flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-primary cursor-pointer relative"
          >
            <img 
              src={avatarPreview}
              alt="Current Avatar" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Camera className="w-7 h-7 text-white mb-1" />
                  <span className="text-[10px] text-white font-bold">更换头像</span>
                </>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 right-0 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-surface" onClick={handleAvatarClick}>
            <Edit className="w-4 h-4" />
          </div>
        </section>

        <form onSubmit={handleSave} className="w-full space-y-8">
          {/* Read-only: Account */}
          <div className="group">
            <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2 ml-1">学号（不可修改）</label>
            <div className="relative flex items-center bg-surface-container-low rounded-xl px-4 py-4 opacity-60">
              <IdCard className="text-outline mr-3 w-5 h-5" />
              <span className="text-on-surface">{userInfo?.account ?? '—'}</span>
            </div>
          </div>

          {/* Read-only: Real Name */}
          <div className="group">
            <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2 ml-1">真实姓名（不可修改）</label>
            <div className="relative flex items-center bg-surface-container-low rounded-xl px-4 py-4 opacity-60">
              <User className="text-outline mr-3 w-5 h-5" />
              <span className="text-on-surface">{userInfo?.name ?? '—'}</span>
            </div>
          </div>

          {/* Editable: Username */}
          <div className="group">
            <label className="block text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-2 ml-1">昵称</label>
            <div className="relative flex items-center bg-surface-container-low rounded-xl px-4 py-4 transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <User className="text-outline group-focus-within:text-primary mr-3 w-5 h-5" />
              <input 
                className="bg-transparent border-none focus:ring-0 w-full text-on-surface placeholder:text-outline p-0 outline-none" 
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="设置显示昵称"
                type="text"
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-focus-within:w-full"></div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              保存成功，正在返回...
            </div>
          )}

          <div className="pt-4">
            <button 
              className="w-full py-4 bg-gradient-to-b from-primary to-primary-container text-on-primary font-headline font-bold text-lg rounded-xl shadow-[0_12px_32px_rgba(0,91,191,0.2)] active:scale-[0.98] transition-all hover:opacity-90 disabled:opacity-60" 
              type="submit"
              disabled={saving || uploading}
            >
              {saving ? '保存中...' : '保存更改'}
            </button>
          </div>
        </form>

        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="w-full flex items-center gap-4 px-4 opacity-30">
            <div className="h-[1px] flex-1 bg-outline"></div>
            <span className="text-[10px] tracking-widest font-headline font-bold">科研共创</span>
            <div className="h-[1px] flex-1 bg-outline"></div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-[-100px] right-[-100px] w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed top-[20%] left-[-80px] w-48 h-48 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
    </div>
  );
};
