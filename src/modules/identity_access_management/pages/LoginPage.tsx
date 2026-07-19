import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'

import { resolveLandingRoute } from '@/shared/lib/landingRoute'
import { useAuthStore } from '@/shared/store/authStore'

import { useLogin } from '../hooks/useLogin'
import { resolveLoginAlert } from './loginAlert'

import './LoginPage.css'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { status, errorCode, errorMessage, session, signIn, clearError, isBusy } = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (status === 'ready' && session) {
    const dest = resolveLandingRoute(session.roles, params.get('returnUrl'))
    return <Navigate to={dest} replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    clearError()
    try {
      await signIn({ email, password })
      const nextSession = useAuthStore.getState().session
      const roles = nextSession?.roles ?? []
      navigate(resolveLandingRoute(roles, params.get('returnUrl')), { replace: true })
    } catch {
      /* store already holds error */
    }
  }

  const alert = resolveLoginAlert({ status, errorCode, errorMessage })

  return (
    <div className="login">
      <section className="login__panel" aria-labelledby="login-title">
        <p className="login__eyebrow">SmartFactory</p>
        <h1 id="login-title">Đăng nhập Web</h1>
        <p className="login__lead">
          Xác thực qua Supabase Auth (NB01-001). Phiên nghiệp vụ được nạp từ{' '}
          <code>/api/auth/session</code> với <code>X-App-Type=web</code>.
        </p>
        <form className="login__form" onSubmit={onSubmit}>
          <label className="login__field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              disabled={isBusy}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="login__field">
            <span>Mật khẩu</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={isBusy}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {alert ? (
            <p className="login__error" role="alert" data-error-code={alert.code}>
              {alert.message}
            </p>
          ) : null}
          <button type="submit" className="login__submit" disabled={isBusy}>
            {isBusy ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </div>
  )
}
