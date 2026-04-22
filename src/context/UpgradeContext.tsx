import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UpgradeDialog } from '@src/packages/header/components/UpgradeDialog';

interface UpgradeContextType {
  openUpgradeDialog: () => void;
  closeUpgradeDialog: () => void;
}

const UpgradeContext = createContext<UpgradeContextType | undefined>(undefined);

export const UpgradeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openUpgradeDialog = () => setIsOpen(true);
  const closeUpgradeDialog = () => setIsOpen(false);

  return (
    <UpgradeContext.Provider value={{ openUpgradeDialog, closeUpgradeDialog }}>
      {children}
      <UpgradeDialog isOpen={isOpen} onClose={closeUpgradeDialog} />
    </UpgradeContext.Provider>
  );
};

export const useUpgradeDialog = () => {
  const context = useContext(UpgradeContext);
  if (context === undefined) {
    throw new Error('useUpgradeDialog must be used within an UpgradeProvider');
  }
  return context;
};
