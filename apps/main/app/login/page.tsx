"use client"
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useSearchParams } from "next/navigation";

// Typography constants
const TYPOGRAPHY = {
  h1: 'text-3xl md:text-4xl', // 24px/32px
  h2: 'text-2xl md:text-3xl', // 20px/24px
  h3: 'text-xl md:text-2xl',  // 18px/20px
  body: 'text-base md:text-lg', // 16px/18px
  small: 'text-sm md:text-base', // 14px/16px
  tiny: 'text-xs md:text-sm',  // 12px/14px
} as const;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const getSafeRedirect = () => {
    if (redirectParam && redirectParam.startsWith("/")) {
      return redirectParam;
    }
    return "/launchdesk";
  };

  const handleKeycloakLogin = async () => {
    try {
      setLoading(true);
      await signIn("keycloak", {
        callbackUrl: getSafeRedirect(),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001233] via-[#002366] to-[#001233] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#001233]/50 via-[#002366]/50 to-[#001233]/50" />
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0061ff]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3385ff]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl mx-4 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-[#0061ff]/10"
      >
        {/* Left: Login Form */}
        <div className="w-full md:w-3/5 flex flex-col justify-center items-center p-6 md:p-10 relative">
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-[#0061ff]/20 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-[#0061ff]/20 rounded-br-3xl" />

          {/* IDDION Logo with animation */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6 relative"
          >
            <div className="absolute -inset-4 bg-[#0061ff]/5 rounded-full blur-xl" />
            <img
              src="/images/logoiddion.png"
              alt="IDDION Logo"
              className="h-auto w-36 transform hover:scale-105 transition-transform duration-300 relative z-10"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center relative mb-8"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0061ff]/5 to-[#3385ff]/5 rounded-2xl blur-lg" />
            <h1 className={`${TYPOGRAPHY.h1} font-extrabold bg-gradient-to-r from-[#0061ff] to-[#3385ff] bg-clip-text text-transparent mb-3 relative z-10`}>
              Welcome to IDDION
            </h1>
            <p className={`${TYPOGRAPHY.body} text-gray-600 relative z-10`}>
              Sign in to access your workforce platform
            </p>
          </motion.div>

          {/* Login Buttons */}
          <div className="w-full max-w-sm space-y-3">

            {/* IDDION Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleKeycloakLogin}
              disabled={loading || googleLoading || microsoftLoading}
              className="group relative w-full bg-gradient-to-r from-[#0061ff] to-[#3385ff] hover:from-[#004dc7] hover:to-[#0061ff] text-white font-semibold py-3 md:py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className={TYPOGRAPHY.body}>Signing in...</span>
                </div>
              ) : (
                <>
                  <div className="relative w-6 h-6">
                    <div className="absolute inset-0 bg-white rounded-full shadow-inner" />
                    <span className="absolute inset-0 flex items-center justify-center text-[#0061ff] font-bold text-xs">
                      IN
                    </span>
                  </div>
                  <span className={TYPOGRAPHY.body}>Sign in with IDDION</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Additional Info */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className={`mt-6 ${TYPOGRAPHY.small} text-gray-500 flex items-center gap-2`}
          >
            <svg className="w-4 h-4 text-[#0061ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure access to your workforce management platform
          </motion.p>
        </div>

        {/* Right: Illustration/Info */}
        <div className="hidden md:flex flex-col justify-center items-center w-2/5 bg-gradient-to-br from-[#001233] via-[#002366] to-[#001233] p-8 md:p-10 relative overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0061ff]/10 via-[#3385ff]/10 to-[#0061ff]/10 animate-gradient" />
          
          {/* Content */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative z-10 text-center"
          >
            <h2 className={`${TYPOGRAPHY.h2} text-white font-bold mb-4 leading-tight`}>
              Empower your workforce<br />
              <span className="bg-gradient-to-r from-[#0061ff] to-[#3385ff] bg-clip-text text-transparent">with confidence</span>
            </h2>
            <p className={`${TYPOGRAPHY.body} text-white/90 mb-6 leading-relaxed`}>
              Your all-in-one workforce platform delivering control, compliance, and efficiency.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-[#0061ff]/10 rounded-2xl blur-xl" />
              <img
                src="/images/logindashboard.png"
                alt="Dashboard Illustration"
                className="w-64 md:w-72 h-auto object-contain rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300 relative z-10"
              />
            </motion.div>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#0061ff]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3385ff]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className={`absolute bottom-4 text-white/60 ${TYPOGRAPHY.tiny} flex items-center gap-2`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#0061ff]" />
        © {new Date().getFullYear()} IDDION Platform. All rights reserved.
      </motion.div>

      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}