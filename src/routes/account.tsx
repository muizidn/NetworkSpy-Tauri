import React from 'react';
import { FiUser, FiMail, FiShield, FiExternalLink } from 'react-icons/fi';

export default function AccountPage() {
  const user = {
    name: "Muiz Izzuddin",
    email: "muiz@netspy.io",
    status: "Professional Plan",
    memberSince: "March 2024"
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] p-12 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-6 mb-12">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-500/20">
            {user.name[0]}
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
            <p className="text-zinc-500 font-medium">{user.status}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#161616] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-zinc-500 mb-4 uppercase text-[10px] font-bold tracking-widest">
              <FiMail size={14} />
              <span>Email Address</span>
            </div>
            <p className="text-zinc-100 font-mono">{user.email}</p>
          </div>

          <div className="bg-[#161616] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-zinc-500 mb-4 uppercase text-[10px] font-bold tracking-widest">
              <FiShield size={14} />
              <span>Subscription</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-zinc-100">{user.status}</p>
              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 text-[9px] font-bold rounded border border-green-500/20 uppercase">Active</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Account Actions</h3>
            <div className="grid grid-cols-1 gap-3">
                <button className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all group">
                    <span className="text-sm text-zinc-300">Billing Portal</span>
                    <FiExternalLink size={14} className="text-zinc-500 group-hover:text-blue-500" />
                </button>
                <button className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all group">
                    <span className="text-sm text-zinc-300">Change Password</span>
                    <FiExternalLink size={14} className="text-zinc-500 group-hover:text-blue-500" />
                </button>
                <button className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/10 transition-all group mt-8">
                    <span className="text-sm text-red-500 font-bold">Sign Out</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
