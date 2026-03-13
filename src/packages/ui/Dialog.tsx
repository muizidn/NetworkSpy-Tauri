import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiInfo, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'info' | 'error' | 'success';
}

export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
  const getIcon = () => {
    switch (type) {
      case 'error': return <FiAlertCircle size={40} className="text-red-500" />;
      case 'success': return <FiCheckCircle size={40} className="text-green-500" />;
      default: return <FiInfo size={40} className="text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="p-8 flex flex-col items-center text-center">
              <div className="mb-6 p-4 rounded-3xl bg-white/5 border border-white/10">
                {getIcon()}
              </div>
              
              <h3 className="text-xl font-black text-white mb-2 tracking-tight">
                {title}
              </h3>
              
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                {message}
              </p>
              
              <Button 
                title="GOT IT" 
                onClick={onClose}
                className="w-full py-3 h-auto text-[11px] font-black tracking-widest bg-zinc-100 hover:bg-white text-black border-none rounded-xl" 
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
