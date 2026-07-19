import { useState, type FormEvent, useEffect, useRef } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'

import { resolveLandingRoute } from '@/shared/lib/landingRoute'
import { useAuthStore } from '@/shared/store/authStore'

import { useLogin } from '../hooks/useLogin'
import { resolveLoginAlert } from './loginAlert'
import { Button } from '@/shared/components/ui/Button'

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  HelpCircle,
  ShieldAlert,
  Server,
  Building2,
  Info,
} from 'lucide-react'

import './LoginPage.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { status, errorCode, errorMessage, session, signIn, clearError, isBusy } = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockActive, setCapsLockActive] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(false)

  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Initialize and auto-focus fields
  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberEmail(true)
      // Focus password field if email is prefilled
      if (passwordInputRef.current) {
        passwordInputRef.current.focus()
      }
    } else {
      // Focus email field if empty
      if (emailInputRef.current) {
        emailInputRef.current.focus()
      }
    }
  }, [])

  if (status === 'ready' && session) {
    const dest = resolveLandingRoute(session.roles, params.get('returnUrl'))
    return <Navigate to={dest} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    clearError()
    try {
      if (rememberEmail) {
        localStorage.setItem('remembered_email', email)
      } else {
        localStorage.removeItem('remembered_email')
      }

      await signIn({ email, password })
      const nextSession = useAuthStore.getState().session
      const roles = nextSession?.roles ?? []
      navigate(resolveLandingRoute(roles, params.get('returnUrl')), { replace: true })
    } catch {
      /* store already holds error */
    }
  }

  function handlePasswordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const capsActive = e.getModifierState('CapsLock')
    setCapsLockActive(capsActive)
  }

  const alert = resolveLoginAlert({ status, errorCode, errorMessage })

  return (
    <main className="min-height-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans select-none overflow-hidden h-screen w-screen">
      
      {/* LEFT COLUMN: Industrial / Enterprise Branding Panel */}
      <section 
        className="hidden md:flex md:w-[55%] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-850"
        aria-label="Tổng quan hệ thống SmartFactory"
      >
        {/* Subtle geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="industrial-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#industrial-grid)" />
          </svg>
        </div>

        {/* Blueprint line graphic background */}
        <div className="absolute right-0 bottom-0 w-[80%] h-[60%] opacity-20 pointer-events-none">
          <svg className="w-full h-full text-blue-400" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
            <path d="M 0,200 L 400,200" stroke="currentColor" strokeWidth="1" />
            <path d="M 200,0 L 200,300" stroke="currentColor" strokeWidth="1" />
            <rect x="140" y="140" width="120" height="120" stroke="currentColor" strokeWidth="1.5" rx="8" />
            <polygon points="200,100 240,160 160,160" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            <path d="M 80,100 Q 200,50 320,100" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Brand identity header */}
        <div className="flex items-center gap-3 z-10 animate-fade-in">
          {/* Logo element size: 56px */}
          <div className="w-[56px] h-[56px] bg-blue-600 rounded-xl flex items-center justify-center shadow-lg border border-blue-500">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              <path d="M2 10h20" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-white font-sans">
              SmartFactory
            </h1>
            <p className="text-[12px] text-slate-400 font-sans tracking-wide">
              Hệ thống Điều hành Doanh nghiệp
            </p>
          </div>
        </div>

        {/* Overview illustration and branding text */}
        <div className="z-10 flex flex-col gap-6 max-w-lg mt-auto mb-auto">
          <div>
            <h2 className="text-[30px] font-semibold leading-tight tracking-tight text-white">
              Nền tảng Điều hành Sản xuất Nhất quán
            </h2>
            <p className="text-[14px] text-slate-350 mt-3 font-sans leading-relaxed">
              Quản lý vận hành sản xuất, kho bãi và chất lượng trên cùng một hệ thống doanh nghiệp. Thiết kế tối ưu cho độ ổn định và sử dụng công nghiệp hàng ngày.
            </p>
          </div>

          {/* Isometric assembly representation outline */}
          <div className="border border-slate-800 bg-slate-900/60 p-5 rounded-2xl flex flex-col gap-3 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-xs text-blue-400 font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Phân hệ Hệ thống
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs font-medium">
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 flex flex-col gap-1">
                <span className="text-white">MES</span>
                <span className="text-[11px] text-slate-400 font-normal">Lập lịch & Điều độ sản xuất</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 flex flex-col gap-1">
                <span className="text-white">WMS</span>
                <span className="text-[11px] text-slate-400 font-normal">Nguyên vật liệu & Tồn kho</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/50 flex flex-col gap-1">
                <span className="text-white">QMS</span>
                <span className="text-[11px] text-slate-400 font-normal">Đánh giá chất lượng NCR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer legal & copyright info */}
        <div className="text-[12px] text-slate-450 z-10 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>Bộ giải pháp SmartFactory v2.3.1</span>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </section>

      {/* RIGHT COLUMN: The login panel */}
      <section 
        className="flex-1 flex flex-col justify-between items-center p-8 bg-slate-50 dark:bg-slate-950 relative h-full overflow-y-auto"
        aria-label="Cổng Xác thực An toàn"
      >
        <div className="w-full flex justify-end md:hidden">
          {/* Mobil logo */}
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
              <path d="M2 10h20" />
            </svg>
            <span className="text-[16px] font-bold text-slate-800 dark:text-slate-200">SmartFactory</span>
          </div>
        </div>

        {/* Central Card container */}
        <div className="my-auto w-full max-w-[440px] flex flex-col gap-6 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col gap-6">
            
            {/* Header section inside card */}
            <div className="flex flex-col gap-2">
              <h2 className="text-[26px] font-semibold tracking-tight text-slate-850 dark:text-slate-100 font-sans">
                Chào mừng quay trở lại
              </h2>
              <p className="text-[14px] text-slate-450 dark:text-slate-400 font-sans leading-snug">
                Đăng nhập để tiếp tục sử dụng hệ thống SmartFactory.
              </p>
            </div>

            {/* Main Form container */}
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              
              {/* Email address field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-700 dark:text-slate-355">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={emailInputRef}
                    name="email"
                    type="email"
                    required
                    placeholder="Nhập địa chỉ email công ty..."
                    value={email}
                    disabled={isBusy}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-sans"
                    aria-label="Địa chỉ Email Công ty"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[13px] font-medium text-slate-700 dark:text-slate-355">
                    Mật khẩu
                  </label>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={passwordInputRef}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    disabled={isBusy}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handlePasswordKeyDown}
                    className="w-full h-11 pl-10 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all font-sans"
                    aria-label="Mật khẩu Tài khoản"
                  />
                  
                  {/* Show/Hide password toggle */}
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-655 focus:outline-none cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Caps Lock notification banner */}
                {capsLockActive && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-405 mt-1 font-medium">
                    <ShieldAlert size={14} />
                    <span>Caps Lock đang bật</span>
                  </div>
                )}
              </div>

              {/* Remember email configuration */}
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-2 text-xs text-slate-655 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberEmail}
                    onChange={(e) => setRememberEmail(e.target.checked)}
                    className="rounded border-slate-350 dark:border-slate-800 text-blue-600 cursor-pointer"
                  />
                  <span>Ghi nhớ thiết bị đăng nhập</span>
                </label>
              </div>

              {/* Server Alert Message inline panel */}
              {alert && (
                <div 
                  className="p-3.5 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 text-red-650 flex items-start gap-2.5 text-xs font-sans mt-1 animate-pulse-subtle"
                  role="alert" 
                  data-error-code={alert.code}
                >
                  <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{alert.message}</span>
                </div>
              )}

              {/* Authorize action submit button */}
              <Button
                type="submit"
                disabled={isBusy}
                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-all text-[14px] mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isBusy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>

            {/* Helper links container */}
            <div className="flex items-center justify-between text-xs text-slate-450 dark:text-slate-400 mt-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <a href="#forgot" className="hover:text-blue-600 hover:underline transition-colors flex items-center gap-1">
                <HelpCircle size={13} />
                Quên mật khẩu?
              </a>
              <span className="text-slate-300 dark:text-slate-800">|</span>
              <a href="mailto:admin@company.com" className="hover:text-blue-600 hover:underline transition-colors">
                Liên hệ Quản trị viên
              </a>
              <span className="text-slate-300 dark:text-slate-800">|</span>
              <a href="#help" className="hover:text-blue-600 hover:underline transition-colors">
                Trợ giúp?
              </a>
            </div>
          </div>

          {/* Session details environment specifications */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
            <div className="flex items-center gap-1">
              <Server size={11} />
              <span>Môi trường: Production</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Building2 size={11} />
              <span>Nhà máy: HCM Plant</span>
            </div>
            <span>•</span>
            <div>Phiên bản 2.3.1</div>
          </div>
        </div>

        {/* Global Footer panel */}
        <footer className="text-[11px] text-slate-400 dark:text-slate-500 mt-auto pt-6 text-center w-full">
          <div className="flex justify-center gap-4 mb-1">
            <span>© 2026 Hệ thống SmartFactory. Bảo lưu mọi quyền.</span>
          </div>
          <div className="flex justify-center gap-3">
            <a href="#privacy" className="hover:underline">Chính sách bảo mật</a>
            <span>•</span>
            <a href="#terms" className="hover:underline">Điều khoản dịch vụ</a>
          </div>
        </footer>
      </section>

    </main>
  )
}
