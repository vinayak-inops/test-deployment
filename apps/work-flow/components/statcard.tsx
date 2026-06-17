"use client"
import React, { useState } from 'react';
import { TrendingUp, Users, DollarSign, FileSpreadsheet, Bell, Search, Settings } from 'lucide-react';

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  color,
  fromColor,
  toColor,
  delay
}: { 
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  color: string;
  fromColor: string;
  toColor: string;
  delay: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden rounded-xl border border-white/10 ${color} p-4 shadow-lg transition-all duration-500 hover:scale-[1.02] hover:shadow-xl animate-fade-in`}
      style={{ animationDelay: delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-10 flex items-start gap-6">
        <div className={`rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-300 ${isHovered ? 'scale-110 bg-white/20 rotate-3' : ''}`}>
          <Icon className={`h-8 w-8 text-white transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium uppercase tracking-wider text-white/80">{title}</p>
            <div className={`h-1 w-8 rounded-full bg-white/20 transition-all duration-300 ${isHovered ? 'w-12 bg-white/30' : ''}`}></div>
          </div>
          <p className="mt-3 text-3xl font-bold text-white transition-all duration-300 hover:scale-105">{value}</p>
          
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
            <p className="text-sm font-medium text-white/90">{description}</p>
          </div>
      <div 
        className={`absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-${fromColor} to-${toColor} opacity-50 blur-3xl transition-all duration-500 ${isHovered ? 'scale-150 opacity-70' : ''}`}
      ></div>
      <div 
        className={`absolute -left-16 -bottom-16 h-56 w-56 rounded-full bg-gradient-to-tr from-${toColor} to-${fromColor} opacity-0 blur-3xl transition-all duration-500 ${isHovered ? 'opacity-40' : ''}`}
      ></div>
    </div>
  );
}

function StatCardMain() {
  return (
    <div>
      {/* <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="text-xl font-semibold text-slate-800">Enterprise Analytics</span>
            </div>
            <div className="flex flex-1 items-center justify-center px-8">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search analytics..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-600 placeholder-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                <Bell className="h-5 w-5" />
              </button>
              <button className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100">
                <Settings className="h-5 w-5" />
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
            </div>
          </div>
        </div>
      </nav> */}

      <div className="mx-auto max-w-7xl p-6">
        {/* <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 animate-fade-in">
                Business Performance
              </h1>
              <p className="mt-2 text-slate-600">
                Track key metrics and business growth indicators
              </p>
            </div>
            <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95">
              Export Report
            </button>
          </div>
        </div> */}
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Revenue"
            value="$59,690"
            description="Last 30 days"
            icon={DollarSign}
            color="bg-gradient-to-br from-blue-600 to-blue-700"
            fromColor="blue-400"
            toColor="blue-700"
            delay="0ms"
          />
          
          <StatCard
            title="Orders"
            value="4,865"
            description="↑ 12% from last month"
            icon={FileSpreadsheet}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            fromColor="blue-300"
            toColor="blue-600"
            delay="100ms"
          />
          
          <StatCard
            title="Customers"
            value="2,245"
            description="↑ 8% from last week"
            icon={Users}
            color="bg-gradient-to-br from-blue-700 to-blue-800"
            fromColor="blue-500"
            toColor="blue-800"
            delay="200ms"
          />
          
          <StatCard
            title="Growth"
            value="18.2%"
            description="↑ 4% from last quarter"
            icon={TrendingUp}
            color="bg-gradient-to-br from-blue-800 to-blue-900"
            fromColor="blue-600"
            toColor="blue-900"
            delay="300ms"
          />
        </div>
      </div>
    </div>
  );
}

export default StatCardMain;