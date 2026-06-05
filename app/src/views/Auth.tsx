import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdCard, Lock, FlaskConical, Camera, Edit, User, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loginStudent, loginAdmin, registerStudent } from '../api/auth';
import { useAuth } from '../store/auth';

export const Auth: React.FC = () => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loginType, setLoginType] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuth();

  // 已登录直接跳转
  React.useEffect(() => {
    if (isLoggedIn) navigate('/labs', { replace: true });
  }, [isLoggedIn, navigate]);

  // ===== 登录状态 =====
  const [loginAccount, setLoginAccount] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const data = loginType === 'STUDENT' 
        ? await loginStudent(loginAccount, loginPassword)
        : await loginAdmin(loginAccount, loginPassword);
      login(data.token, data.userInfo);
      // If admin, they might want to go straight to labs but with the portal visible
      navigate('/labs');
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoginLoading(false);
    }
  };

  // ===== 注册状态 =====
  const [regAccount, setRegAccount] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUserName, setRegUserName] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regPassword.length < 6) {
      setRegError('密码至少6位');
      return;
    }
    setRegLoading(true);
    try {
      await registerStudent({ account: regAccount, password: regPassword, name: regName, userName: regUserName || undefined });
      setRegSuccess(true);
      setTimeout(() => {
        setTab('login');
        setLoginAccount(regAccount);
        setRegSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
      <main className="w-full max-w-md lg:max-w-4xl bg-surface-container-lowest rounded-3xl overflow-hidden academic-shadow flex flex-col lg:flex-row min-h-[600px]">
        {/* Left Side: Visual Branding (Desktop) */}
        <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary-container items-center justify-center p-12">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1pIi0eSOCyleyjxyDgeQ3NLmkTdtLU7odKxS3-wtumWGtviI8_lPOqwLBiIdkCG-LqmIonoVCziQAxED4eZ5rb2Nq83XViT__dLdsnjXWLWp_zHy4tfQg_YpMkc4Dx6cpioNCHgA2MT5hTn-dHIB2xaBUREefO7_U201I6G9gzy-QUFZQLGaskDQa6KRxPaF3vG9Y5lUAnrCuacfDXiPEn_ySRNWPRdyC_Mim3MQ-4G5DOhEx-XS78DO8JEUtHMy4qQLbE-PadsI" 
              alt="Laboratory Research" 
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-container/90"></div>
          </div>
          <div className="relative z-10 text-on-primary">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <FlaskConical className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="font-headline font-extrabold text-4xl tracking-tighter mb-4 leading-tight">
              实验室预约系统<br/>数字学术中心
            </h1>
            <p className="text-primary-fixed opacity-80 text-lg font-light leading-relaxed">
              欢迎来到学术策展平台。通过数字化管理，让您的科研实验更加高效、有序。
            </p>
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <span className="text-sm font-medium tracking-wide">实时设备占用监控</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary"></div>
                <span className="text-sm font-medium tracking-wide">智能实验室排期优化</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Form Content */}
        <section className="flex-1 p-8 lg:p-12 flex flex-col justify-center bg-surface">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center">
            <h2 className={`font-headline font-bold text-2xl tracking-tight transition-colors ${loginType === 'ADMIN' ? 'text-indigo-600' : 'text-primary'}`}>
              {loginType === 'ADMIN' ? '管理员入口' : '实验室预约系统'}
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              {loginType === 'ADMIN' ? '请使用管理员工号登录' : '请登录或注册以继续'}
            </p>
          </div>

          {/* User Type Switcher */}
          <div className="flex bg-surface-container-low p-1 rounded-2xl mb-6 w-full max-w-[320px] mx-auto lg:mx-0">
            <button 
              onClick={() => { setLoginType('STUDENT'); setTab('login'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                loginType === 'STUDENT' ? 'bg-primary text-white shadow-md' : 'text-on-surface-variant'
              }`}
            >
              学生入口
            </button>
            <button 
              onClick={() => { setLoginType('ADMIN'); setTab('login'); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                loginType === 'ADMIN' ? 'bg-indigo-600 text-white shadow-md' : 'text-on-surface-variant'
              }`}
            >
              管理员
            </button>
          </div>

          {/* Tab Switcher (Only show if Student) */}
          <div className={`flex bg-surface-container-low p-1 rounded-2xl mb-10 w-full max-w-[280px] mx-auto lg:mx-0 transition-opacity ${loginType === 'ADMIN' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button 
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                tab === 'login' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              登录
            </button>
            <button 
              onClick={() => setTab('register')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                tab === 'register' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              注册
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-semibold text-on-surface-variant uppercase tracking-widest px-1">
                    {loginType === 'ADMIN' ? '管理员账号 / 工号' : '学号'}
                  </label>
                  <div className="relative group">
                    <IdCard className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline transition-colors ${loginType === 'ADMIN' ? 'group-focus-within:text-indigo-500' : 'group-focus-within:text-primary'}`} />
                    <input 
                      className={`w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline input-shadow transition-all outline-none focus:ring-2 ${loginType === 'ADMIN' ? 'focus:ring-indigo-500/20' : 'focus:ring-primary/20'}`} 
                      placeholder={loginType === 'ADMIN' ? "请输入管理员账号" : "请输入您的学号"} 
                      type="text"
                      value={loginAccount}
                      onChange={e => setLoginAccount(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[0.75rem] font-semibold text-on-surface-variant uppercase tracking-widest px-1">密码</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" />
                    <input 
                      className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-2xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 input-shadow transition-all outline-none" 
                      placeholder="请输入密码" 
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {loginError}
                  </div>
                )}

                <button 
                  className={`w-full py-4 text-on-primary font-bold rounded-2xl shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${
                    loginType === 'ADMIN' 
                      ? 'bg-gradient-to-b from-indigo-600 to-indigo-800 shadow-indigo-200' 
                      : 'bg-gradient-to-b from-primary to-primary-container shadow-primary/20'
                  }`} 
                  type="submit"
                  disabled={loginLoading}
                >
                  {loginLoading ? '登录中...' : loginType === 'ADMIN' ? '管理员登录' : '立即登录'}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister}
                className="space-y-5"
              >
                {/* Avatar placeholder */}
                <div className="flex justify-center mb-2">
                  <div className="relative group cursor-pointer">
                    <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-dashed border-outline-variant group-hover:border-primary transition-colors">
                      <Camera className="w-8 h-8 text-outline group-hover:text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-on-primary p-1.5 rounded-lg shadow-sm">
                      <Edit className="w-3.5 h-3.5" />
                    </div>
                    <span className="block text-center text-[10px] text-on-surface-variant mt-2 font-medium">头像注册后可修改</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[0.7rem] font-semibold text-on-surface-variant uppercase tracking-widest px-1">学号 *</label>
                    <div className="relative group">
                      <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                      <input 
                        className="w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 input-shadow outline-none" 
                        placeholder="8位学号" 
                        type="text"
                        value={regAccount}
                        onChange={e => setRegAccount(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[0.7rem] font-semibold text-on-surface-variant uppercase tracking-widest px-1">真实姓名 *</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                      <input 
                        className="w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 input-shadow outline-none" 
                        placeholder="您的姓名"
                        type="text"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[0.7rem] font-semibold text-on-surface-variant uppercase tracking-widest px-1">昵称（可选）</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 input-shadow outline-none" 
                    placeholder="自定义显示名称（可留空）"
                    type="text"
                    value={regUserName}
                    onChange={e => setRegUserName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[0.7rem] font-semibold text-on-surface-variant uppercase tracking-widest px-1">设置密码 *</label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline group-focus-within:text-primary transition-colors" />
                    <input 
                      className="w-full pl-10 pr-3 py-3 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary/20 input-shadow outline-none" 
                      placeholder="至少6位"
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                {regError && (
                  <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {regError}
                  </div>
                )}

                {regSuccess && (
                  <div className="text-center text-sm text-green-600 bg-green-50 px-4 py-3 rounded-xl font-medium">
                    注册成功！正在跳转到登录...
                  </div>
                )}

                <button 
                  className="w-full py-4 mt-2 bg-gradient-to-b from-primary to-primary-container text-on-primary font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-200 disabled:opacity-60" 
                  type="submit"
                  disabled={regLoading}
                >
                  {regLoading ? '注册中...' : '完成注册'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </section>
      </main>
      
      {/* Visual Accents */}
      <div className="fixed top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10 translate-x-1/3 translate-y-1/3"></div>
    </div>
  );
};
