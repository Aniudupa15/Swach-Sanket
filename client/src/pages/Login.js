import React, { useState } from 'react';
// Make sure to install lucide-react: npm install lucide-react
import { Lock, Mail, Eye, EyeOff, Leaf, AlertCircle } from 'lucide-react'; 
// 🔥 IMPORTANT: Import the necessary hooks and service files
import { useNavigate } from "react-router-dom";
import api from "../services/api"; 


export default function LoginPage() {
  const [email, setEmail] = useState('admin@swachsanket.com'); // Pre-fill for demo UX
  const [password, setPassword] = useState('admin123'); // Pre-fill for demo UX
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // 🔥 New state for handling and displaying errors
  const [error, setError] = useState(''); 

  // 🔥 Initialize the navigation hook
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true);

    // This checks if you are in mock mode (like your old code)
    const MOCK_MODE = !process.env.REACT_APP_API_BASE;

    try {
      let token;
      
      if (MOCK_MODE) {
        // --- MOCK LOGIC ---
        if (email === "admin@swachsanket.com" && password === "admin123") {
          token = "fake-jwt-token";
        } else {
          // Use the Error state to display the failure message
          throw new Error("Invalid mock credentials");
        }
      } else {
        // --- REAL API LOGIC ---
        const resp = await api.post("/api/auth/login", { email, password });
        token = resp.data.token || resp.data.accessToken;
      }

      // --- SUCCESS LOGIC ---
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_email", email);
      // navigate("/dashboard");
      navigate("/zilla-dashboard");
      // navigate("/driver-dashboard"); // 🔥 REDIRECT TO DASHBOARD ON SUCCESS

    } catch (err) {
      // --- ERROR HANDLING ---
      const errorMessage = err.response?.data?.message || err.message || "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          
          {/* Header Section (unchanged) */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
              <Leaf className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Zilla Panchayat MRF Portal
            </h1>
            <p className="text-emerald-50 text-sm">
              Smart Waste Management System
            </p>
          </div>

          {/* Form Section */}
          <div className="p-8">
            
            {/* 🔥 NEW: Error Alert Box */}
            {error && (
              <div role="alert" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="block sm:inline font-medium text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email Input (unchanged) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Input (unchanged) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password (unchanged) */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button (unchanged) */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transform transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Mock Credentials (unchanged) */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-2 font-medium">
                Demo Credentials
              </p>
              <p className="text-sm text-gray-700 text-center">
                <span className="font-medium">Email:</span> admin@example.com
              </p>
              <p className="text-sm text-gray-700 text-center">
                <span className="font-medium">Password:</span> password123
              </p>
            </div>
          </div>
        </div>

        {/* Footer (unchanged) */}
        <p className="text-center text-white text-sm mt-6">
          © 2024 Zilla Panchayat. All rights reserved.
        </p>
      </div>
    </div>
  );
}