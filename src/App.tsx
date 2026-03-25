/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef, useMemo, ChangeEvent, RefObject } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Languages, 
  ArrowRightLeft, 
  Copy, 
  Check, 
  Volume2, 
  RotateCcw,
  Sparkles,
  ChevronDown,
  Globe,
  Mic,
  MicOff,
  Sun,
  Moon,
  VolumeX,
  History,
  Star,
  Image as ImageIcon,
  MessageSquare,
  X,
  Trash2,
  Camera,
  Upload,
  User,
  Bot,
  AlertCircle,
  Key,
  ExternalLink,
  Clipboard
} from 'lucide-react';

const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect', flag: '✨', speechCode: 'en-US' },
  { code: 'en', name: 'English', flag: '🇺🇸', speechCode: 'en-US' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸', speechCode: 'es-ES' },
  { code: 'fr', name: 'French', flag: '🇫🇷', speechCode: 'fr-FR' },
  { code: 'de', name: 'German', flag: '🇩🇪', speechCode: 'de-DE' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳', speechCode: 'zh-CN' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', speechCode: 'ja-JP' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', speechCode: 'ko-KR' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', speechCode: 'it-IT' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', speechCode: 'pt-PT' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', speechCode: 'ru-RU' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', speechCode: 'ar-SA' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', speechCode: 'hi-IN' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', speechCode: 'bn-BD' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷', speechCode: 'tr-TR' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳', speechCode: 'vi-VN' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱', speechCode: 'pl-PL' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱', speechCode: 'nl-NL' },
  { code: 'th', name: 'Thai', flag: '🇹🇭', speechCode: 'th-TH' },
  { code: 'id', name: 'Indonesian', flag: '🇮🇩', speechCode: 'id-ID' },
  { code: 'el', name: 'Greek', flag: '🇬🇷', speechCode: 'el-GR' },
];

interface HistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: number;
  isFavorite: boolean;
  category?: string;
}

interface ProFeatures {
  smartDictionary: boolean;
  multiTarget: boolean;
  exportTools: boolean;
  grammarPro: boolean;
  categories: boolean;
}

const CATEGORIES = ['General', 'Travel', 'Business', 'Emergency', 'Social', 'Academic'];

interface ChatMessage {
  id: string;
  text: string;
  translatedText: string;
  lang: string;
  sender: 'user1' | 'user2';
}

export default function App() {
  // Core State
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [secondTranslatedText, setSecondTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('es');
  const [secondTargetLang, setSecondTargetLang] = useState('fr');
  const [isLoading, setIsLoading] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('app_theme') === 'dark');
  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('custom_gemini_api_key') || '');

  const ai = useMemo(() => {
    const key = customApiKey || process.env.GEMINI_API_KEY || "";
    return new GoogleGenAI({ apiKey: key });
  }, [customApiKey]);
  
  // Feature State
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('translation_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showProTools, setShowProTools] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const [dictionaryInfo, setDictionaryInfo] = useState<any>(null);
  const [isSourceFocused, setIsSourceFocused] = useState(false);
  const [sourceCopied, setSourceCopied] = useState(false);

  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const targetRef = useRef<HTMLTextAreaElement>(null);
  const secondTargetRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = (ref: RefObject<HTMLTextAreaElement>) => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight(sourceRef);
  }, [sourceText]);

  useEffect(() => {
    adjustHeight(targetRef);
  }, [translatedText]);

  useEffect(() => {
    adjustHeight(secondTargetRef);
  }, [secondTranslatedText]);

  useEffect(() => {
    const handleResize = () => {
      adjustHeight(sourceRef);
      adjustHeight(targetRef);
      adjustHeight(secondTargetRef);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        setSourceText(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('Please use Ctrl+V (or Cmd+V) to paste, as your browser may be blocking direct clipboard access.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const [proFeatures, setProFeatures] = useState<ProFeatures>(() => {
    const saved = localStorage.getItem('pro_features');
    return saved ? JSON.parse(saved) : {
      smartDictionary: false,
      multiTarget: false,
      exportTools: false,
      grammarPro: false,
      categories: false
    };
  });

  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('translation_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('pro_features', JSON.stringify(proFeatures));
  }, [proFeatures]);

  useEffect(() => {
    localStorage.setItem('custom_gemini_api_key', customApiKey);
  }, [customApiKey]);

  useEffect(() => {
    localStorage.setItem('app_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setSourceText(transcript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const lang = LANGUAGES.find(l => l.code === (sourceLang === 'auto' ? 'en' : sourceLang))?.speechCode || 'en-US';
      recognitionRef.current.lang = lang;
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string, langCode: string) => {
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = LANGUAGES.find(l => l.code === langCode)?.speechCode || 'en-US';
    utterance.lang = lang;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const translate = useCallback(async (text: string, from: string, to: string, saveToHistory = true, isSecond = false) => {
    if (!text.trim()) {
      if (isSecond) setSecondTranslatedText('');
      else {
        setTranslatedText('');
        setDetectedLang(null);
        setDictionaryInfo(null);
      }
      return;
    }

    if (!isSecond) setIsLoading(true);
    setError(null);

    try {
      const fromLangName = from === 'auto' ? 'automatically detected language' : LANGUAGES.find(l => l.code === from)?.name;
      const toLangName = LANGUAGES.find(l => l.code === to)?.name;

      const isSingleWord = text.trim().split(/\s+/).length === 1;
      const shouldGetDictionary = proFeatures.smartDictionary && isSingleWord && !isSecond;

      let prompt = "";
      if (shouldGetDictionary) {
        prompt = `Translate the word "${text}" from ${fromLangName} to ${toLangName}. 
                 Also provide its definition, 3 synonyms, and 2 example sentences in both languages.
                 Return the response in JSON format: {
                   "translatedText": "Translation",
                   "detectedLanguage": "Language Name",
                   "definition": "Definition",
                   "synonyms": ["syn1", "syn2", "syn3"],
                   "examples": [{"source": "example in source", "target": "example in target"}]
                 }`;
      } else if (from === 'auto' && !isSecond) {
        prompt = `Detect the language of the following text and translate it to ${toLangName}. 
                 Return the response in JSON format: {"detectedLanguage": "Language Name", "translatedText": "Translation"}.
                 Text: ${text}`;
      } else {
        prompt = `Translate the following text from ${fromLangName} to ${toLangName}. Only return the translated text, nothing else.\n\nText: ${text}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: (from === 'auto' || shouldGetDictionary) && !isSecond ? { responseMimeType: "application/json" } : undefined
      });

      let resultText = "";
      if (shouldGetDictionary) {
        const data = JSON.parse(response.text || "{}");
        resultText = data.translatedText || "";
        setDetectedLang(data.detectedLanguage || null);
        setDictionaryInfo(data);
      } else if (from === 'auto' && !isSecond) {
        const data = JSON.parse(response.text || "{}");
        resultText = data.translatedText || "";
        setDetectedLang(data.detectedLanguage || null);
      } else {
        resultText = response.text || "";
      }

      if (isSecond) {
        setSecondTranslatedText(resultText);
      } else {
        setTranslatedText(resultText);
        if (saveToHistory && resultText) {
          const newItem: HistoryItem = {
            id: Math.random().toString(36).substr(2, 9),
            sourceText: text,
            translatedText: resultText,
            sourceLang: from === 'auto' ? (detectedLang || 'auto') : from,
            targetLang: to,
            timestamp: Date.now(),
            isFavorite: false,
            category: 'General'
          };
          setHistory(prev => [newItem, ...prev.slice(0, 49)]);
        }
      }
    } catch (err: any) {
      console.error("Translation error:", err);
      const errorMsg = err.message || String(err);
      if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        setError("Rate limit reached (15 requests/min). Please wait 60 seconds.");
      } else if (errorMsg.includes('API key') || errorMsg.includes('invalid')) {
        setError("Invalid API key. Please check your configuration in Pro Tools.");
      } else {
        setError("Failed to translate. Please try again.");
      }
    } finally {
      if (!isSecond) setIsLoading(false);
    }
  }, [detectedLang, proFeatures.smartDictionary, ai]);

  // Debounce translation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sourceText.trim() && !isListening && !isConversationMode) {
        translate(sourceText, sourceLang, targetLang);
        if (proFeatures.multiTarget) {
          translate(sourceText, sourceLang, secondTargetLang, false, true);
        }
      } else if (!sourceText.trim()) {
        setTranslatedText("");
        setSecondTranslatedText("");
        setDetectedLang(null);
        setDictionaryInfo(null);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang, secondTargetLang, translate, isListening, isConversationMode, proFeatures.multiTarget]);

  const polishText = async () => {
    if (!sourceText.trim()) return;
    setIsPolishing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Correct the grammar, spelling, and style of the following text to make it sound professional and natural. Only return the corrected text.\n\nText: ${sourceText}`,
      });
      setSourceText(response.text || sourceText);
    } catch (err) {
      console.error("Polishing error:", err);
    } finally {
      setIsPolishing(false);
    }
  };

  const exportHistory = () => {
    if (history.length === 0) return;
    const headers = ['Source Text', 'Translated Text', 'Source Lang', 'Target Lang', 'Category', 'Date'];
    const rows = history.map(item => [
      `"${item.sourceText.replace(/"/g, '""')}"`,
      `"${item.translatedText.replace(/"/g, '""')}"`,
      item.sourceLang,
      item.targetLang,
      item.category || 'General',
      new Date(item.timestamp).toLocaleString()
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `translation_history_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateCategory = (id: string, category: string) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, category } : item
    ));
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const toLangName = LANGUAGES.find(l => l.code === targetLang)?.name;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: file.type,
              },
            },
            {
              text: `Extract all text from this image and translate it to ${toLangName}. Return only the translated text.`,
            },
          ],
        });

        setTranslatedText(response.text || "Could not extract text.");
      };
    } catch (err) {
      setError("Failed to process image.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (id: string) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleSwap = () => {
    if (sourceLang === 'auto') return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'bg-[#0F172A] text-white' : 'bg-[#F9FAFB] text-[#111827]'}`}>
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className={`p-2 rounded-xl shadow-lg transition-colors ${isDarkMode ? 'bg-indigo-500 shadow-indigo-900/20' : 'bg-indigo-600 shadow-indigo-200'}`}>
              <Languages className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>DLC Modern</h1>
              <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Pro Translator</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setIsConversationMode(false)}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${!isConversationMode ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
              >
                Standard
              </button>
              <button 
                onClick={() => setIsConversationMode(true)}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${isConversationMode ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
              >
                Conversation
              </button>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 border-l border-gray-200 dark:border-gray-700 pl-2 sm:pl-4">
              <button 
                onClick={() => setShowProTools(true)} 
                className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} relative`}
                title="Pro Tools"
              >
                <Sparkles className={`w-5 h-5 ${Object.values(proFeatures).some(v => v) ? 'text-indigo-500' : ''}`} />
              </button>
              <button onClick={() => setShowHistory(true)} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <History className="w-5 h-5" />
              </button>
              <button onClick={() => setShowFavorites(true)} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Star className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100 shadow-sm'}`}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-4 border ${isDarkMode ? 'bg-red-900/20 border-red-500/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-500/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {isConversationMode ? (
            <ConversationView 
              isDarkMode={isDarkMode} 
              sourceLang={sourceLang} 
              targetLang={targetLang}
              setSourceLang={setSourceLang}
              setTargetLang={setTargetLang}
              ai={ai}
            />
          ) : (
            <motion.div 
              key="standard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Controls Bar */}
              <div className={`lg:col-span-2 flex flex-col sm:flex-row items-center justify-between p-2 rounded-2xl border transition-all mb-2 gap-2 ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-1 sm:gap-4 w-full sm:flex-1">
                  <div className="relative flex-1 sm:max-w-[200px]">
                    <select 
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      className={`w-full appearance-none border-none rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
                  </div>

                  <button 
                    onClick={handleSwap}
                    disabled={sourceLang === 'auto'}
                    className={`p-2 rounded-xl transition-colors disabled:opacity-20 ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <ArrowRightLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <div className="relative flex-1 sm:max-w-[200px]">
                    <select 
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className={`w-full appearance-none border-none rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}
                    >
                      {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button 
                    onClick={() => setSourceText('')}
                    className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="relative group">
                <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-0 group-focus-within:opacity-20 transition duration-500`}></div>
                <div className={`relative rounded-3xl border transition-all overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                  <div className="p-4 sm:p-6 flex-1 flex flex-col relative">
                    {sourceLang === 'auto' && detectedLang && (
                      <div className="mb-2">
                        <span className="text-[10px] font-bold bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Detected: {detectedLang}
                        </span>
                      </div>
                    )}
                    <div className="relative flex-1 flex flex-col">
                      {!sourceText && !isSourceFocused && (
                        <button 
                          onClick={handlePaste}
                          className={`absolute left-2 top-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border shadow-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                        >
                          <Clipboard className="w-3 h-3" />
                          Paste
                        </button>
                      )}
                      <textarea
                        ref={sourceRef}
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        onFocus={() => setIsSourceFocused(true)}
                        onBlur={() => setIsSourceFocused(false)}
                        placeholder={!isSourceFocused && !sourceText ? "" : "Type, speak, or upload an image..."}
                        className={`w-full resize-none border-none focus:ring-0 text-lg sm:text-xl font-medium placeholder:text-gray-400 transition-colors bg-transparent overflow-y-auto min-h-[44px] max-h-[60vh] ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
                        rows={1}
                      />
                    </div>
                  </div>
                  <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t flex items-center justify-between transition-colors ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50/50 border-gray-50'}`}>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-indigo-400' : 'hover:bg-white hover:shadow-sm text-gray-400 hover:text-indigo-600'}`}
                        title="Translate from Image"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      
                      <button 
                        onClick={toggleListening}
                        className={`p-2 rounded-lg transition-all relative ${isListening ? 'bg-red-500 text-white' : isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-white text-gray-400'}`}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      {proFeatures.grammarPro && (
                        <button 
                          onClick={polishText}
                          disabled={isPolishing || !sourceText}
                          className={`p-2 rounded-lg transition-all ${isPolishing ? 'animate-pulse text-indigo-500' : isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-white text-gray-400'}`}
                          title="Grammar Pro: Polish Text"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => speak(sourceText, sourceLang === 'auto' ? 'en' : sourceLang)} className="p-2 text-gray-400 hover:text-indigo-500">
                        <Volume2 className="w-5 h-5" />
                      </button>
                      <button onClick={() => {
                        navigator.clipboard.writeText(sourceText);
                        setSourceCopied(true);
                        setTimeout(() => setSourceCopied(false), 2000);
                      }} className="p-2 text-gray-400 hover:text-indigo-500">
                        {sourceCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Output Area */}
              <div className="flex flex-col gap-6">
                <div className={`relative rounded-3xl border transition-all overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-2xl' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                  <div className="p-4 sm:p-6 flex-1 flex flex-col relative">
                    {isLoading && (
                      <div className={`absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm z-10 ${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'}`}>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
                      </div>
                    )}
                    <textarea
                      ref={targetRef}
                      readOnly
                      value={translatedText}
                      placeholder="Translation will appear here..."
                      className={`w-full resize-none border-none focus:ring-0 text-lg sm:text-xl font-medium transition-colors bg-transparent overflow-y-auto min-h-[44px] max-h-[60vh] ${!translatedText ? 'text-gray-500' : isDarkMode ? 'text-white' : 'text-gray-800'}`}
                      rows={1}
                    />
                  </div>
                  <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t flex items-center justify-between transition-colors ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50/50 border-gray-50'}`}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => speak(translatedText, targetLang)} className="p-2 text-gray-400 hover:text-indigo-500">
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        navigator.clipboard.writeText(translatedText);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }} className="p-2 text-gray-400 hover:text-indigo-500">
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {proFeatures.multiTarget && (
                  <div className={`relative rounded-3xl border transition-all overflow-hidden flex flex-col ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-lg shadow-gray-200/30'}`}>
                    <div className="px-6 py-3 border-b flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Second Target</span>
                        <select 
                          value={secondTargetLang}
                          onChange={(e) => setSecondTargetLang(e.target.value)}
                          className="bg-transparent text-xs font-bold border-none focus:ring-0 p-0"
                        >
                          {LANGUAGES.filter(l => l.code !== 'auto').map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.flag} {lang.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <textarea
                        ref={secondTargetRef}
                        readOnly
                        value={secondTranslatedText}
                        placeholder="Second translation..."
                        className={`w-full resize-none border-none focus:ring-0 text-lg font-medium transition-colors bg-transparent overflow-y-auto min-h-[44px] max-h-[40vh] ${!secondTranslatedText ? 'text-gray-500' : isDarkMode ? 'text-white' : 'text-gray-800'}`}
                        rows={1}
                      />
                    </div>
                  </div>
                )}

                {proFeatures.smartDictionary && dictionaryInfo && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-3xl border p-6 ${isDarkMode ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-100'}`}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Globe className="w-5 h-5 text-indigo-500" />
                      <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Smart Dictionary</h3>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Definition</p>
                        <p className="text-sm font-medium">{dictionaryInfo.definition}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Synonyms</p>
                        <div className="flex flex-wrap gap-2">
                          {dictionaryInfo.synonyms?.map((s: string) => (
                            <span key={s} className={`px-2 py-1 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'}`}>{s}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Examples</p>
                        <div className="space-y-2">
                          {dictionaryInfo.examples?.map((ex: any, i: number) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium">"{ex.source}"</p>
                              <p className="text-indigo-500 italic">"{ex.target}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Side Panels */}
      <SidePanel 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        title="History" 
        isDarkMode={isDarkMode}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">{history.length} items</p>
          {proFeatures.exportTools && (
            <button 
              onClick={exportHistory}
              className="flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-600"
            >
              <Upload className="w-3 h-3" />
              Export CSV
            </button>
          )}
        </div>
        <div className="space-y-4">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No history yet.</p>
          ) : (
            history.map(item => (
              <HistoryCard 
                key={item.id} 
                item={item} 
                onFavorite={() => toggleFavorite(item.id)} 
                onDelete={() => deleteHistoryItem(item.id)}
                isDarkMode={isDarkMode}
                proFeatures={proFeatures}
                onUpdateCategory={(cat: string) => updateCategory(item.id, cat)}
              />
            ))
          )}
        </div>
      </SidePanel>

      <SidePanel 
        isOpen={showFavorites} 
        onClose={() => setShowFavorites(false)} 
        title="Favorites" 
        isDarkMode={isDarkMode}
      >
        <div className="space-y-4">
          {history.filter(h => h.isFavorite).length === 0 ? (
            <p className="text-center text-gray-500 py-10">No favorites yet.</p>
          ) : (
            history.filter(h => h.isFavorite).map(item => (
              <HistoryCard 
                key={item.id} 
                item={item} 
                onFavorite={() => toggleFavorite(item.id)} 
                onDelete={() => deleteHistoryItem(item.id)}
                isDarkMode={isDarkMode}
                proFeatures={proFeatures}
                onUpdateCategory={(cat: string) => updateCategory(item.id, cat)}
              />
            ))
          )}
        </div>
      </SidePanel>

      <SidePanel
        isOpen={showProTools}
        onClose={() => setShowProTools(false)}
        title="Pro Tools"
        isDarkMode={isDarkMode}
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-500">Enable advanced features to supercharge your translations.</p>
          
          <div className="space-y-4">
            <FeatureToggle 
              id="smartDictionary"
              title="Smart Dictionary"
              description="Get definitions, synonyms, and examples for single words."
              isActive={proFeatures.smartDictionary}
              onToggle={() => setProFeatures(prev => ({ ...prev, smartDictionary: !prev.smartDictionary }))}
              isDarkMode={isDarkMode}
            />
            <FeatureToggle 
              id="multiTarget"
              title="Multi-Target Mode"
              description="Translate to two languages at the same time."
              isActive={proFeatures.multiTarget}
              onToggle={() => setProFeatures(prev => ({ ...prev, multiTarget: !prev.multiTarget }))}
              isDarkMode={isDarkMode}
            />
            <FeatureToggle 
              id="grammarPro"
              title="Grammar Pro"
              description="Polish your source text for professional results."
              isActive={proFeatures.grammarPro}
              onToggle={() => setProFeatures(prev => ({ ...prev, grammarPro: !prev.grammarPro }))}
              isDarkMode={isDarkMode}
            />
            <FeatureToggle 
              id="exportTools"
              title="Export Tools"
              description="Download your history as CSV for offline use."
              isActive={proFeatures.exportTools}
              onToggle={() => setProFeatures(prev => ({ ...prev, exportTools: !prev.exportTools }))}
              isDarkMode={isDarkMode}
            />
            <FeatureToggle 
              id="categories"
              title="Phrasebook Categories"
              description="Organize your favorites into searchable categories."
              isActive={proFeatures.categories}
              onToggle={() => setProFeatures(prev => ({ ...prev, categories: !prev.categories }))}
              isDarkMode={isDarkMode}
            />
          </div>

          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-indigo-500" />
              <h4 className="font-bold text-sm">Custom API Key</h4>
            </div>
            <p className="text-xs text-gray-500 mb-3">Override the default API key if you hit rate limits.</p>
            
            <a 
              href="https://aistudio.google.com/app/apikey" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-600 mb-3 uppercase tracking-wider"
            >
              Get Free API Key <ExternalLink className="w-3 h-3" />
            </a>

            <div className="relative">
              <input 
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Enter your Gemini API Key..."
                className={`w-full px-4 py-3 rounded-xl text-sm border transition-all focus:ring-2 focus:ring-indigo-500 outline-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}
              />
              {customApiKey && (
                <button 
                  onClick={() => setCustomApiKey('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
            <p className="mt-2 text-[10px] text-gray-400">Your key is stored locally in your browser.</p>
          </div>
        </div>
      </SidePanel>
    </div>
  );
}

function FeatureToggle({ title, description, isActive, onToggle, isDarkMode }: any) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${isActive ? 'border-indigo-500 bg-indigo-500/5' : isDarkMode ? 'border-gray-800 bg-gray-800/50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold">{title}</h4>
        <button 
          onClick={onToggle}
          className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-indigo-600' : 'bg-gray-400'}`}
        >
          <motion.div 
            animate={{ x: isActive ? 20 : 2 }}
            className="absolute top-1 w-3 h-3 bg-white rounded-full"
          />
        </button>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

function SidePanel({ isOpen, onClose, title, children, isDarkMode }: any) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className={`fixed right-0 top-0 bottom-0 w-full max-w-md z-50 shadow-2xl p-6 flex flex-col ${isDarkMode ? 'bg-gray-900 border-l border-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function HistoryCard({ item, onFavorite, onDelete, isDarkMode, proFeatures, onUpdateCategory }: any) {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          <span>{LANGUAGES.find(l => l.code === item.sourceLang)?.flag} {item.sourceLang}</span>
          <ArrowRightLeft className="w-3 h-3" />
          <span>{LANGUAGES.find(l => l.code === item.targetLang)?.flag} {item.targetLang}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onFavorite} className={`p-1.5 rounded-lg ${item.isFavorite ? 'text-yellow-500' : 'text-gray-400'}`}>
            <Star className="w-4 h-4 fill-current" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-sm font-medium mb-1 line-clamp-2">{item.sourceText}</p>
      <p className={`text-sm font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{item.translatedText}</p>
      
      {proFeatures?.categories && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <select 
            value={item.category || 'General'}
            onChange={(e) => onUpdateCategory(e.target.value)}
            className="w-full bg-transparent text-[10px] font-bold uppercase tracking-widest text-gray-400 border-none focus:ring-0 p-0"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

function ConversationView({ isDarkMode, sourceLang, targetLang, setSourceLang, setTargetLang, ai }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState<'user1' | 'user2' | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = async (event: any) => {
        const text = event.results[0][0].transcript;
        const from = isListening === 'user1' ? sourceLang : targetLang;
        const to = isListening === 'user1' ? targetLang : sourceLang;
        
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: `Translate from ${LANGUAGES.find(l => l.code === from)?.name} to ${LANGUAGES.find(l => l.code === to)?.name}: ${text}`,
        });

        const newMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          text,
          translatedText: response.text || "",
          lang: from,
          sender: isListening as any
        };

        setMessages(prev => [...prev, newMessage]);
        setIsListening(null);
        
        // Auto-speak translation
        const utterance = new SpeechSynthesisUtterance(newMessage.translatedText);
        utterance.lang = LANGUAGES.find(l => l.code === to)?.speechCode || 'en-US';
        window.speechSynthesis.speak(utterance);
      };
      recognitionRef.current.onend = () => setIsListening(null);
    }
  }, [isListening, sourceLang, targetLang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startListening = (user: 'user1' | 'user2') => {
    if (isListening) return;
    setIsListening(user);
    recognitionRef.current.lang = LANGUAGES.find(l => l.code === (user === 'user1' ? sourceLang : targetLang))?.speechCode || 'en-US';
    recognitionRef.current.start();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-4xl mx-auto rounded-3xl border overflow-hidden flex flex-col h-[500px] sm:h-[600px] ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-2xl' : 'bg-white border-gray-100 shadow-xl'}`}
    >
      <div className={`p-3 sm:p-4 border-b flex items-center justify-between ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
            <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)} className="bg-transparent text-[10px] sm:text-xs font-bold border-none focus:ring-0 p-0">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name.split(' ')[0]}</option>)}
            </select>
          </div>
          <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <div className="flex items-center gap-1 sm:gap-2">
            <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="bg-transparent text-[10px] sm:text-xs font-bold border-none focus:ring-0 p-0">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name.split(' ')[0]}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="text-[10px] sm:text-xs font-bold text-gray-400 hover:text-red-500">Clear</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">Start a conversation by tapping a microphone below.</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user1' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'user1' ? (isDarkMode ? 'bg-gray-700' : 'bg-gray-100') : (isDarkMode ? 'bg-indigo-600' : 'bg-indigo-600 text-white')}`}>
              <p className="text-xs opacity-60 mb-1">{msg.text}</p>
              <p className="text-base font-bold">{msg.translatedText}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4 border-t border-gray-100 dark:border-gray-700">
        <button 
          onClick={() => startListening('user1')}
          disabled={!!isListening}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 p-3 sm:p-4 rounded-2xl transition-all ${isListening === 'user1' ? 'bg-red-500 text-white animate-pulse' : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-sm font-bold truncate max-w-full">{LANGUAGES.find(l => l.code === sourceLang)?.name}</span>
        </button>
        <button 
          onClick={() => startListening('user2')}
          disabled={!!isListening}
          className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 p-3 sm:p-4 rounded-2xl transition-all ${isListening === 'user2' ? 'bg-red-500 text-white animate-pulse' : isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[10px] sm:text-sm font-bold truncate max-w-full">{LANGUAGES.find(l => l.code === targetLang)?.name}</span>
        </button>
      </div>
    </motion.div>
  );
}
