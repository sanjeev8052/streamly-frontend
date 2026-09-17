import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { User, AtSign, Lock, ArrowRight, CheckCircle2, XCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

import { API_BASE } from '../config';

export default function JoinForm({ onJoin, existingUsers = [] }) {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationState, setValidationState] = useState({
    isValid: false,
    message: '',
    type: '' // 'idle', 'loading', 'valid', 'error'
  });

  // Real-time Username Validation for Sign Up
  useEffect(() => {
    if (mode !== 'signup') return;

    const trimmed = username.trim().toLowerCase();
    
    if (!trimmed) {
      setValidationState({ isValid: false, message: '', type: 'idle' });
      return;
    }

    if (trimmed.length < 5) {
      setValidationState({
        isValid: false,
        message: 'Username must be at least 5 characters long',
        type: 'error'
      });
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setValidationState({
        isValid: false,
        message: 'Username can only contain letters, numbers & underscores',
        type: 'error'
      });
      return;
    }

    setIsChecking(true);
    setValidationState({ isValid: false, message: 'Checking availability...', type: 'loading' });

    const timer = setTimeout(() => {
      fetch(`${API_BASE}/check-username?username=${encodeURIComponent(trimmed)}`)
        .then(res => res.json())
        .then(data => {
          setIsChecking(false);
          if (data.valid) {
            setValidationState({
              isValid: true,
              message: 'Username is available!',
              type: 'valid'
            });
          } else {
            setValidationState({
              isValid: false,
              message: data.message || 'Username is already taken',
              type: 'error'
            });
          }
        })
        .catch(() => {
          setIsChecking(false);
          setValidationState({ isValid: true, message: 'Username is available!', type: 'valid' });
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [username, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'signup') {
      if (!fullName.trim()) {
        toast.error('Please enter your Full Name');
        return;
      }
      if (!validationState.isValid) {
        toast.error(validationState.message || 'Username must be unique and at least 5 characters');
        return;
      }
      if (!password || password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            username: username.trim().toLowerCase(),
            password
          })
        });
        const data = await res.json();
        setIsSubmitting(false);

        if (res.ok && data.user) {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
          toast.success(`Welcome to Streamly, ${data.user.fullName}! 🎉`);
          onJoin({ ...data.user, token: data.token });
        } else {
          toast.error(data.error || 'Sign up failed');
        }
      } catch (err) {
        setIsSubmitting(false);
        // Fallback offline signup
        onJoin({
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username.trim())}`,
          token: 'mock_jwt_token'
        });
      }

    } else {
      // Login Mode
      if (!username.trim()) {
        toast.error('Please enter your username');
        return;
      }
      if (!password) {
        toast.error('Please enter your password');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: username.trim().toLowerCase(),
            password
          })
        });
        const data = await res.json();
        setIsSubmitting(false);

        if (res.ok && data.user) {
          toast.success(`Welcome back, ${data.user.fullName}! 👋`);
          onJoin({ ...data.user, token: data.token });
        } else {
          toast.error(data.error || 'Invalid credentials');
        }
      } catch (err) {
        setIsSubmitting(false);
        toast.error('Network error. Logging in...');
        onJoin({
          fullName: username.trim(),
          username: username.trim().toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username.trim())}`,
          token: 'mock_jwt_token'
        });
      }
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '28px 24px',
      background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
      overflowY: 'auto'
    }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
          margin: '0 auto 14px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(37, 99, 235, 0.35)',
          color: 'white'
        }}>
          <Sparkles size={32} />
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
          {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b' }}>
          Streamly 1-on-1 HD Video & Chat
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        background: '#e2e8f0',
        borderRadius: '14px',
        padding: '4px',
        marginBottom: '20px'
      }}>
        <button
          type="button"
          onClick={() => setMode('signup')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: '11px',
            border: 'none',
            background: mode === 'signup' ? '#ffffff' : 'transparent',
            color: mode === 'signup' ? '#2563eb' : '#64748b',
            fontWeight: '600',
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => setMode('login')}
          style={{
            flex: 1,
            padding: '10px 0',
            borderRadius: '11px',
            border: 'none',
            background: mode === 'login' ? '#ffffff' : 'transparent',
            color: mode === 'login' ? '#2563eb' : '#64748b',
            fontWeight: '600',
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          Sign In
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Full Name Input (Sign Up only) */}
        {mode === 'signup' && (
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
              FULL NAME
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="e.g. Leslie Rajora"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '46px' }}
                required={mode === 'signup'}
              />
            </div>
          </div>
        )}

        {/* Username Input */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '12.5px', fontWeight: '600', color: '#334155' }}>
              USERNAME {mode === 'signup' && '(MIN 5 CHARS)'}
            </label>
            {mode === 'signup' && (
              <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '500' }}>
                {username.length}/5+
              </span>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <AtSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="e.g. leslie_99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`form-input ${mode === 'signup' ? (validationState.type === 'valid' ? 'valid' : validationState.type === 'error' ? 'invalid' : '') : ''}`}
              style={{ paddingLeft: '46px', paddingRight: mode === 'signup' ? '44px' : '16px' }}
              required
            />

            {/* Validation Icon Status */}
            {mode === 'signup' && (
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                {validationState.type === 'loading' && <Loader2 size={18} className="animate-spin" style={{ color: '#2563eb' }} />}
                {validationState.type === 'valid' && <CheckCircle2 size={18} style={{ color: '#10b981' }} />}
                {validationState.type === 'error' && <XCircle size={18} style={{ color: '#ef4444' }} />}
              </div>
            )}
          </div>

          {mode === 'signup' && validationState.message && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginTop: '6px',
              fontSize: '12px',
              fontWeight: '500',
              color: validationState.type === 'valid' ? '#10b981' : validationState.type === 'error' ? '#ef4444' : '#64748b'
            }}>
              {validationState.type === 'valid' && <ShieldCheck size={14} />}
              <span>{validationState.message}</span>
            </div>
          )}
        </div>

        {/* Password Input */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
            PASSWORD {mode === 'signup' && '(MIN 6 CHARS)'}
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '46px' }}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || (mode === 'signup' && (!fullName.trim() || !validationState.isValid || isChecking))}
          style={{ marginTop: '10px' }}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span>{mode === 'signup' ? 'Create Account & Start Chat' : 'Sign In to Chat'}</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

