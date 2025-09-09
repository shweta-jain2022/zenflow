import { createContext, useContext, useState } from 'react';

interface FocusContextType {
  isFocusModeActive: boolean;
  setFocusModeActive: (active: boolean) => void;
}

const FocusContext = createContext<FocusContextType>({
  isFocusModeActive: false,
  setFocusModeActive: () => {},
});

export const useFocus = () => {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
};

interface FocusProviderProps {
  children: React.ReactNode;
}

export const FocusProvider = ({ children }: FocusProviderProps) => {
  const [isFocusModeActive, setIsFocusModeActive] = useState(false);

  const setFocusModeActive = (active: boolean) => {
    setIsFocusModeActive(active);
  };

  return (
    <FocusContext.Provider value={{ isFocusModeActive, setFocusModeActive }}>
      {children}
    </FocusContext.Provider>
  );
};