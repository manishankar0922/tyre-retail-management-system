"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth.service";
import { Disc, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in both email and password fields.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await loginUser(email, password);

      if (!result.success || !result.user) {
        setErrorMsg(result.message || "Authentication failed. Invalid credentials.");
        setIsLoading(false);
        return;
      }

      const user = result.user;

      // Store session in localStorage to support legacy client layout caches
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Set cookies for middleware access
      document.cookie = `currentUser=${encodeURIComponent(
        JSON.stringify(user)
      )}; path=/; max-age=86400; SameSite=Lax`;
      
      if (result.accessToken) {
        document.cookie = `sb-access-token=${result.accessToken}; path=/; max-age=86400; SameSite=Lax`;
      }

      // Redirect strictly based on user roles
      if (user.role === "owner") {
        router.push("/owner/dashboard");
      } else {
        router.push("/accountant");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected system error occurred during login.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Left Panel: Branding & ERP Illustration (Desktop only) */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950/20 border-r border-zinc-900/60 relative overflow-hidden">
        {/* Decorative Grid Mesh Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.12),rgba(255,255,255,0))] pointer-events-none" />
        
        {/* Branding Header */}
        <div className="flex items-center gap-3.5 z-10 shrink-0 select-none">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Disc className="w-5.5 h-5.5 text-white animate-[spin_16s_linear_infinite]" />
          </div>
          <div>
            <h1 className="font-black text-sm tracking-wider uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-450 bg-clip-text text-transparent">
              Retail Operations ERP
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">
              Console Center
            </p>
          </div>
        </div>

        {/* Central Content Panel */}
        <div className="my-auto space-y-6 max-w-lg z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-extrabold uppercase tracking-wider">
            <span>Operational Console v2.0</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white">
            Enterprise Shop <br />
            Management System.
          </h2>

          <p className="text-xs text-zinc-400 leading-relaxed font-semibold max-w-md">
            Verify real-time inventory directory details, log commercial invoicing details, track transaction records, and visualize performance charts securely.
          </p>

          {/* Premium UI Dashboard Preview */}
          <div className="relative mt-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-2.5 shadow-2xl shadow-zinc-950/60 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent pointer-events-none" />
            <img 
              src="/login_preview.png" 
              alt="Retail Operations ERP Dashboard Preview" 
              className="rounded-xl border border-zinc-800/60 shadow-inner w-full object-cover select-none group-hover:scale-[1.01] transition-transform duration-500" 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-[9px] text-zinc-650 font-bold tracking-widest uppercase z-10 select-none">
          © 2026 Retail Operations ERP • Secure System Access
        </div>
      </div>

      {/* Right Panel: Login Form (Centered) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-zinc-950 relative">
        <div className="w-full max-w-[390px] space-y-7 z-10">
          
          {/* Header */}
          <div className="space-y-2.5">
            {/* Mobile Branding Header */}
            <div className="flex lg:hidden items-center gap-2.5 mb-4 select-none">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/20">
                <Disc className="w-4.5 h-4.5 text-white animate-[spin_12s_linear_infinite]" />
              </div>
              <h1 className="font-extrabold text-xs tracking-wider uppercase text-zinc-150">
                Retail Operations ERP
              </h1>
            </div>

            <h3 className="text-2xl font-black tracking-tight text-white">
              System Access Portal
            </h3>
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest">
              Please enter your ERP credentials to sign in
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-[11px] font-semibold flex items-start gap-2.5 leading-normal">
                <AlertCircle className="w-4.5 h-4.5 text-rose-550 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="email" 
                className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 dark:text-zinc-500"
              >
                Operator Email Address
              </label>
              <input 
                id="email"
                type="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@retailerp.com"
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs py-3 px-4 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-semibold"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password" 
                className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-450 dark:text-zinc-500"
              >
                Security Credentials
              </label>
              <div className="relative flex items-center">
                <input 
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs py-3 pl-4 pr-11 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-semibold"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-zinc-500 hover:text-zinc-350 cursor-pointer select-none transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-extrabold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 select-none shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none outline-none focus:ring-2 focus:ring-indigo-500/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Sign In To System</span>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

    </div>
  );
}