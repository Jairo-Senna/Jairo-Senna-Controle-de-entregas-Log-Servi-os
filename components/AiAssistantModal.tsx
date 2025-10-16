import React, { useState, useMemo, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AllData, ExpenseData, DailyEntry, DeliveryType } from '../types';
import { ICONS, DELIVERY_TYPE_NAMES } from '../constants';
import { getMonthKey } from '../utils/dateUtils';
import { calculatePeriodTotals } from '../utils/calculationUtils';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  allData: AllData;
  expenses: ExpenseData;
}

const Loader: React.FC = () => (
  <div className="flex justify-center items-center p-8">
    <svg className="animate-spin h-10 w-10 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="ml-4 text-slate-600 dark:text-slate-400">Analisando seus dados...</p>
  </div>
);

const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose, allData, expenses }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dataSummary = useMemo(() => {
    const entries: DailyEntry[] = [];
    const expenseEntries: {key: string, value: number}[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const monthKey = getMonthKey(date);
        const day = date.getDate();
        if (allData[monthKey] && allData[monthKey][day]) {
            entries.push(allData[monthKey][day] as DailyEntry);
        }
    }
    
    Object.keys(expenses).forEach(key => {
        const [year, month, quinzena] = key.split('-');
        const monthKey = `${year}-${month}`;
        const firstDayOfQuinzena = new Date(Number(year), Number(month) - 1, quinzena === '1' ? 1 : 16);
        const daysDiff = (today.getTime() - firstDayOfQuinzena.getTime()) / (1000 * 3600 * 24);
        if (daysDiff <= 30) {
            expenseEntries.push({key, value: expenses[key]});
        }
    });

    if (entries.length === 0) return { summaryString: "Nenhum dado de entrega nos últimos 30 dias.", hasData: false };

    const totals = calculatePeriodTotals(entries);
    const totalExpenses = expenseEntries.reduce((acc, curr) => acc + curr.value, 0);
    const netEarnings = totals.total.earnings - totalExpenses;
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let summaryString = `
- Ganhos Brutos Totais: ${formatCurrency(totals.total.earnings)}
- Gastos com Combustível: ${formatCurrency(totalExpenses)}
- Ganhos Líquidos: ${formatCurrency(netEarnings)}
- Total de Entregas: ${totals.total.count}
- Detalhes Normais: ${totals.normal.count} entregas (${formatCurrency(totals.normal.earnings)})
- Detalhes Expressas: ${totals.express.count} entregas (${formatCurrency(totals.express.earnings)})
`;
    return { summaryString, hasData: true };
  }, [allData, expenses]);

  const handleAnalyze = async () => {
    if (!query || isLoading) return;
    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Você é um assistente financeiro especializado em logística de entregas para autônomos. Seu tom é amigável, encorajador e profissional.
        Analise os dados de entrega dos últimos 30 dias fornecidos abaixo e responda à pergunta do usuário.
        Forneça insights práticos e dicas que possam ajudar o usuário a otimizar seus ganhos.
        Use markdown para formatar a resposta (negrito com **texto** e listas com * item).

        ---
        DADOS DOS ÚLTIMOS 30 DIAS:
        ${dataSummary.summaryString}
        ---

        PERGUNTA DO USUÁRIO:
        "${query}"
      `;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setResponse(geminiResponse.text);
    } catch (e) {
      console.error(e);
      setError("Ocorreu um erro ao contatar a IA. Verifique sua conexão ou tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseMarkdown = (text: string) => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n')
      .map(line => line.trim())
      .map(line => {
        if (line.startsWith('* ') || line.startsWith('- ')) {
          return `<li>${line.substring(2)}</li>`;
        }
        return line ? `<p>${line}</p>` : '';
      }).join('');

    let inList = false;
    let result = '';
    html.split(/(<li>|<\/li>)/).forEach(part => {
        if (part === '<li>') {
            if (!inList) {
                result += '<ul>';
                inList = true;
            }
            result += '<li>';
        } else if (part === '</li>') {
            result += '</li>';
        } else if (part) {
            if (inList) {
                result += '</ul>';
                inList = false;
            }
            result += part;
        }
    });
    if (inList) result += '</ul>';

    return result;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-purple-600 flex items-center">{ICONS.LIGHTBULB} Assistente de Ganhos</h2>
             <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Fechar"
            >
                {ICONS.X_MARK}
            </button>
        </header>

        <div className="p-6 space-y-4 overflow-y-auto">
            {!dataSummary.hasData ? (
                 <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                    <p>Você precisa de pelo menos um registro de entrega nos últimos 30 dias para usar o assistente.</p>
                </div>
            ) : (
                <>
                    <div>
                        <label htmlFor="ai-query" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            O que você gostaria de analisar?
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="ai-query"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="flex-grow bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-800 dark:text-slate-200 focus:ring-purple-500 focus:border-purple-500 transition"
                                placeholder="Ex: Como posso aumentar meus ganhos?"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleAnalyze}
                                className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                                disabled={isLoading || !query}
                            >
                                Perguntar
                            </button>
                        </div>
                    </div>
                    <div className="min-h-[200px] bg-slate-100 dark:bg-slate-900/50 rounded-lg p-4">
                        {isLoading && <Loader />}
                        {error && <p className="text-red-500">{error}</p>}
                        {response && (
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2"
                                dangerouslySetInnerHTML={{ __html: parseMarkdown(response) }}
                            />
                        )}
                        {!isLoading && !response && !error && (
                             <div className="text-center text-slate-500 dark:text-slate-400 pt-8">
                                <p>Faça uma pergunta para receber insights sobre seu desempenho.</p>
                                <p className="text-xs mt-2">Ex: "Qual foi meu dia mais lucrativo?" ou "Me dê dicas para a próxima semana."</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistantModal;