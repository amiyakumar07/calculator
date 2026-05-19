import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  History, 
  Trash2, 
  Copy, 
  Sparkles,
  ChevronLeft,
  Delete,
  CloudLightning
} from 'lucide-react';
import { create, all } from 'mathjs';
import { cn } from './lib/utils';

const math = create(all);

type CalcMode = 'basic' | 'scientific' | 'ai';

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export default function App() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [mode, setMode] = useState<CalcMode>('basic');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const displayEndRef = useRef<HTMLDivElement>(null);

  // Scroll to end of display on input change
  useEffect(() => {
    displayEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [input]);

  // Real-time automatic calculation
  useEffect(() => {
    if (input && mode !== 'ai') {
      try {
        // Basic sanitization: only try to evaluate if ends with a number or closing paren
        if (/[\d\).pi]$/.test(input.trim())) {
          const res = math.evaluate(input);
          const formatted = typeof res === 'number' 
            ? (Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(8)).toString())
            : res.toString();
          
          if (formatted !== input) {
            setResult(formatted);
          } else {
            setResult('');
          }
        } else {
          setResult('');
        }
      } catch (e) {
        setResult('');
      }
    } else {
      setResult('');
    }
  }, [input, mode]);

  const handleAction = (val: string) => {
    if (val === 'AC') {
      setInput('');
      setResult('');
    } else if (val === 'DEL') {
      setInput(prev => prev.slice(0, -1));
    } else if (val === '=') {
      calculateResult();
    } else {
      setInput(prev => prev + val);
    }
  };

  const calculateResult = () => {
    if (!input) return;
    try {
      const res = math.evaluate(input);
      const formattedResult = Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(8)).toString();
      setResult(formattedResult);
      
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        expression: input,
        result: formattedResult,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 50));
      setInput(formattedResult);
    } catch (error) {
      setResult('Error');
    }
  };

  const handleAiCalculate = async () => {
    if (!input) return;
    setIsAiLoading(true);
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input })
      });
      const data = await response.json();
      if (data.result) {
        setResult(data.result);
        const newItem: HistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          expression: `AI: ${input}`,
          result: data.result,
          timestamp: Date.now()
        };
        setHistory(prev => [newItem, ...prev].slice(0, 50));
      }
    } catch (error) {
      setResult('AI Error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const basicButtons = [
    ['AC', 'DEL', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '(', ')'],
    ['=']
  ];

  const scientificButtons = [
    ['sin(', 'cos(', 'tan(', '^'],
    ['log(', 'ln(', 'sqrt(', 'pi'],
    ['e', '!', 'abs(', 'inv('],
    ...basicButtons
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-blue-100 p-4 md:p-8 flex items-center justify-center">
      <motion.div 
        layout
        className="w-full max-w-[400px] bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 overflow-hidden border border-white relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Top Header */}
        <div className="p-6 pb-2 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <History size={18} className="text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Settings size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Display Section */}
        <div className="px-8 py-6 text-right relative">
          <div className="h-16 overflow-x-auto whitespace-nowrap text-[#1D1D1F] text-5xl font-semibold tracking-tight custom-scrollbar mb-2">
            {input || '0'}
            <div ref={displayEndRef} />
          </div>
          <div className="h-10 flex items-end justify-end overflow-hidden text-right">
            <motion.span 
              key={result}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-lg font-medium break-all",
                result === 'Error' ? 'text-red-500' : 'text-gray-400'
              )}
            >
              {result || '0'}
            </motion.span>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="px-6 mb-4">
          <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
            {(['basic', 'scientific', 'ai'] as CalcMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-sm font-medium capitalize transition-all duration-300",
                  mode === m 
                    ? "bg-white text-black shadow-sm" 
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="p-6 pt-0">
          <AnimatePresence mode="wait">
            {mode === 'ai' ? (
              <motion.div
                key="ai"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="relative">
                  <textarea
                    autoFocus
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask math: 'What is 15% tip on 85 dollars?'"
                    className="w-full h-40 p-4 bg-gray-50 border-none rounded-2xl resize-none focus:ring-2 focus:ring-blue-500 transition-all text-lg leading-relaxed placeholder:text-gray-400"
                  />
                  <div className="absolute bottom-3 right-3">
                    <Sparkles className="text-gray-300" size={20} />
                  </div>
                </div>
                <button
                  disabled={isAiLoading || !input}
                  onClick={handleAiCalculate}
                  className={cn(
                    "w-full py-4 rounded-2xl bg-[#1D1D1F] text-white font-semibold text-lg flex items-center justify-center gap-2 transition-all hover:bg-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    isAiLoading && "animate-pulse"
                  )}
                >
                  {isAiLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <CloudLightning size={20} />
                      Calculate with AI
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid gap-3"
              >
                {(mode === 'basic' ? basicButtons : scientificButtons).map((row, i) => (
                  <div key={i} className="flex gap-3 justify-center">
                    {row.map((btn) => (
                      <button
                        key={btn}
                        onClick={() => handleAction(btn)}
                        className={cn(
                          "flex-1 h-14 rounded-2xl text-xl font-medium transition-all active:scale-90",
                          btn === '=' 
                            ? "bg-[#007AFF] text-white hover:bg-[#0066D6] w-full"
                            : ['/', '*', '-', '+', '%'].includes(btn)
                              ? "bg-[#F2F2F7] text-[#007AFF] hover:bg-blue-50"
                              : ['AC', 'DEL'].includes(btn)
                                ? "bg-[#FFF2F2] text-[#FF3B30] hover:bg-red-50"
                                : "bg-white border border-gray-100 text-[#1D1D1F] hover:bg-gray-50 shadow-sm"
                        )}
                        style={btn === '=' ? { flex: '1 0 100%' } : {}}
                      >
                        {btn === 'DEL' ? <Delete className="mx-auto" size={20} /> : btn}
                      </button>
                    ))}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="absolute inset-0 bg-white z-50 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <History size={20} />
                  History
                </h3>
                <div className="flex gap-4">
                  <button onClick={clearHistory} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
                    <Trash2 size={20} />
                  </button>
                  <button onClick={() => setShowHistory(false)} className="bg-gray-100 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                {history.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                    <History size={48} className="opacity-20" />
                    <p>No history yet</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <motion.div 
                      layout
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-2xl bg-gray-50 group relative"
                    >
                      <p className="text-gray-400 text-sm mb-1">{item.expression}</p>
                      <p className="text-xl font-semibold break-words">{item.result}</p>
                      <button 
                        onClick={() => copyToClipboard(item.result)}
                        className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-lg hover:bg-gray-100"
                      >
                        <Copy size={14} className="text-gray-500" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E5E5E5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D1D1D1;
        }
      `}</style>
    </div>
  );
}
