import React from 'react';
import { FiUsers, FiCloud, FiLock, FiZap } from 'react-icons/fi';

export default function AccountPage() {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-12 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-blue-600/10 border border-blue-500/20 rounded-3xl flex items-center justify-center text-blue-500 mx-auto mb-6 shadow-[0_0_50px_rgba(37,99,235,0.15)]">
            <FiUsers size={40} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">Teams & Collaboration</h1>
          <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
            Collaborate with your team in real-time, share traffic sessions, and sync configurations across all your devices.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cloud Syncing Card */}
          <div className="relative bg-[#0f0f0f] border border-zinc-800 rounded-[2rem] p-8 overflow-hidden group hover:border-blue-500/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
              <FiCloud size={120} />
            </div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest mb-6 w-fit">
                Coming Soon
              </div>
              <h3 className="text-xl font-black text-white mb-3">Cloud Syncing</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-8 flex-1">
                Your workspace, automatically synchronized across all your devices. Never lose a custom viewer or filter again.
              </p>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500">
                <FiCloud size={20} />
              </div>
            </div>
          </div>

          {/* Shared Debugging Card */}
          <div className="relative bg-[#0f0f0f] border border-zinc-800 rounded-[2rem] p-8 overflow-hidden group hover:border-purple-500/30 transition-all duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
              <FiUsers size={120} />
            </div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest mb-6 w-fit">
                Team Feature
              </div>
              <h3 className="text-xl font-black text-white mb-3">Shared Debugging</h3>
              <p className="text-xs text-zinc-500 leading-relaxed mb-8 flex-1">
                Instantly share specific traffic captures with teammates via a secure link for lightning-fast troubleshooting.
              </p>
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-500">
                <FiUsers size={20} />
              </div>
            </div>
          </div>

          {/* Asset Syncing Card (Full Width) */}
          <div className="relative bg-[#0f0f0f] border border-zinc-800 rounded-[2rem] p-10 overflow-hidden group hover:border-indigo-500/30 transition-all duration-500 md:col-span-2">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-700 pointer-events-none">
              <FiZap size={200} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-6 w-fit">
                  Enterprise Ready
                </div>
                <h3 className="text-2xl font-black text-white mb-4">Team Asset Sharing</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  Keep your organization's custom viewers, filter presets, and breakpoints in sync. Build a shared library of debugging knowledge.
                </p>
              </div>
              <button className="px-10 py-4 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-xl hover:shadow-indigo-500/30 whitespace-nowrap">
                Join the Waitlist
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] mt-12">
            Professional & Team Licenses Required for Cloud Features
        </p>
      </div>
    </div>
  );
}
