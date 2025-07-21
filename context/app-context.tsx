
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

type EmailContextState = {
    email: string;
    displayName: string;
}

type AppContextType = {
  primaryEmail: EmailContextState;
  setPrimaryEmail: (email: EmailContextState) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function usePrimaryEmail() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('usePrimaryEmail must be used within an AppProvider');
  }
  return context;
}

export function AppProvider({ 
  children,
  initialEmail 
}: { 
  children: ReactNode,
  initialEmail: EmailContextState,
}) {
  const [primaryEmail, setPrimaryEmail] = useState<EmailContextState>(initialEmail);

  return (
    <AppContext.Provider value={{ primaryEmail, setPrimaryEmail }}>
      {children}
    </AppContext.Provider>
  );
}
