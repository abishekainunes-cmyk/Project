import React, { createContext, useContext, useState } from "react";

interface ResumeViewerContextType {
  isOpen: boolean;
  openResume: () => void;
  closeResume: () => void;
}

const ResumeViewerContext = createContext<ResumeViewerContextType>({
  isOpen: false,
  openResume: () => {},
  closeResume: () => {},
});

export const ResumeViewerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ResumeViewerContext.Provider
      value={{
        isOpen,
        openResume: () => setIsOpen(true),
        closeResume: () => setIsOpen(false),
      }}
    >
      {children}
    </ResumeViewerContext.Provider>
  );
};

export const useResumeViewer = () => useContext(ResumeViewerContext);
