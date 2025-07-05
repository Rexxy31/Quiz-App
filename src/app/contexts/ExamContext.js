"use client";

import { createContext, useContext, useState } from 'react';

const ExamContext = createContext();

export function ExamProvider({ children }) {
  const [isExamActive, setIsExamActive] = useState(false);

  const startExam = () => {
    setIsExamActive(true);
  };

  const endExam = () => {
    setIsExamActive(false);
  };

  return (
    <ExamContext.Provider value={{ isExamActive, startExam, endExam }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
} 