import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type UserWord = {
  id: number;
  en: string;
  ru: string;
  level: string;
  topic: string;
  isCustom: true;
};

type WordsContextValue = {
  customWords: UserWord[];
  addWord: (en: string, ru: string, level: string) => UserWord;
};

const WordsContext = createContext<WordsContextValue | null>(null);

let nextId = -1;

export function WordsProvider({ children }: { children: React.ReactNode }) {
  const [customWords, setCustomWords] = useState<UserWord[]>([]);

  const addWord = useCallback((en: string, ru: string, level: string) => {
    const word: UserWord = {
      id: nextId--,
      en: en.trim(),
      ru: ru.trim(),
      level,
      topic: 'Моё слово',
      isCustom: true,
    };
    setCustomWords((prev) => [word, ...prev]);
    return word;
  }, []);

  const value = useMemo(
    () => ({ customWords, addWord }),
    [customWords, addWord],
  );

  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords() {
  const ctx = useContext(WordsContext);
  if (!ctx) throw new Error('useWords must be used within WordsProvider');
  return ctx;
}