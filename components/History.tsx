import React, { useMemo, useState } from 'react';
import { AllData, ExpenseData, BreakdownByType, MonthData } from '../types';
import { ICONS } from '../constants';
import { calculateEntryTotal, calculateDetailedPeriodBreakdown } from '../utils/calculationUtils';
import ReportModal from './ReportModal';

interface HistoryProps {
  allData: AllData;
  expenses: ExpenseData;
}

const calculateQuinzenaTotal = (monthData: AllData[string], quinzena: 1 | 2) => {
    let total = { earnings: 0, count: 0 };
    const startDay = quinzena === 1 ? 1 : 16;
    const endDay = quinzena === 1 ? 15 : 31;
    for (let i = startDay; i <= endDay; i++) {
        if (monthData[i]) {
            const dayTotal = calculateEntryTotal(monthData[i]);
            total.earnings += dayTotal.earnings;
            total.count += dayTotal.count;
        }
    }
    return total;
}

type QuinzenaHistoryItem = {
    id: string;
    monthKey: string;
    quinzena: 1 | 2;
    earnings: number;
    count: number;
    expense: number;
    net: number;
};

const History: React.FC<HistoryProps> = ({ allData, expenses }) => {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedQuinzena, setSelectedQuinzena] = useState<QuinzenaHistoryItem | null>(null);
    const [selectedQuinzenaData, setSelectedQuinzenaData] = useState<MonthData | null>(null);

    const history = useMemo(() => {
        const completedQuinzenas: QuinzenaHistoryItem[] = [];
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const currentDay = today.getDate();

        const sortedMonthKeys = Object.keys(allData).sort().reverse();

        for (const monthKey of sortedMonthKeys) {
            const [year, month] = monthKey.split('-').map(Number);
            const monthData = allData[monthKey];

            // Check 2nd Quinzena first for reverse chronological order
            if (
                year < currentYear ||
                (year === currentYear && month - 1 < currentMonth)
            ) {
                 const total = calculateQuinzenaTotal(monthData, 2);
                 if (total.count > 0) {
                     const quinzenaKey = `${monthKey}-2`;
                     const expense = expenses[quinzenaKey] || 0;
                     const net = total.earnings - expense;
                     completedQuinzenas.push({ 
                        id: `2ª Quinzena ${month}/${year}`, 
                        monthKey,
                        quinzena: 2,
                        earnings: total.earnings,
                        count: total.count,
                        expense,
                        net
                    });
                 }
            }

            // Check 1st Quinzena
            if (
                year < currentYear ||
                (year === currentYear && month - 1 < currentMonth) ||
                (year === currentYear && month - 1 === currentMonth && currentDay > 15)
            ) {
                const total = calculateQuinzenaTotal(monthData, 1);
                if (total.count > 0) {
                     const quinzenaKey = `${monthKey}-1`;
                     const expense = expenses[quinzenaKey] || 0;
                     const net = total.earnings - expense;
                     completedQuinzenas.push({ 
                        id: `1ª Quinzena ${month}/${year}`, 
                        monthKey,
                        quinzena: 1,
                        earnings: total.earnings,
                        count: total.count,
                        expense,
                        net
                    });
                }
            }
        }
        return completedQuinzenas;
    }, [allData, expenses]);
    
    const handleViewReport = (quinzenaData: QuinzenaHistoryItem) => {
        const { monthKey, quinzena } = quinzenaData;
        const [year, month] = monthKey.split('-').map(Number);
        const monthData = allData[monthKey] || {};
        
        const quinzenaEntries: MonthData = {};
        const startDay = quinzena === 1 ? 1 : 16;
        const endDay = quinzena === 1 ? 15 : new Date(year, month, 0).getDate();
        
        for (let i = startDay; i <= endDay; i++) {
            if (monthData[i]) {
                quinzenaEntries[i] = monthData[i];
            }
        }
        
        setSelectedQuinzenaData(quinzenaEntries);
        setSelectedQuinzena(quinzenaData);
        setIsReportModalOpen(true);
    };

    const reportBreakdown = useMemo((): BreakdownByType | null => {
        if (!selectedQuinzena) return null;

        const { monthKey, quinzena } = selectedQuinzena;
        const monthData = allData[monthKey] || {};
        
        const quinzenaEntries = [];
        const startDay = quinzena === 1 ? 1 : 16;
        const endDay = quinzena === 1 ? 15 : 31;
        for (let i = startDay; i <= endDay; i++) {
            if (monthData[i]) {
                quinzenaEntries.push(monthData[i]);
            }
        }

        return calculateDetailedPeriodBreakdown(quinzenaEntries);
    }, [selectedQuinzena, allData]);


    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <>
            <div className="flex-grow p-4 overflow-y-auto">
                <h2 className="text-xl font-bold text-brand-primary flex items-center mb-4">
                    {ICONS.ARCHIVE} Histórico de Quinzenas
                </h2>
                {history.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center mt-4">Nenhum histórico de quinzena fechada ainda.</p>
                ) : (
                    <div className="space-y-4">
                        {history.map((item) => (
                             <div key={item.id} className="bg-slate-200 dark:bg-slate-700 p-4 rounded-lg shadow">
                                <h4 className="font-bold text-md text-slate-800 dark:text-slate-200 mb-3">{item.id}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-baseline border-t border-slate-300 dark:border-slate-600 pt-3">
                                        <span className="font-semibold text-slate-600 dark:text-slate-300">Ganhos Líquidos:</span>
                                        <span className="text-lg font-bold text-accent">{formatCurrency(item.net)}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span>Ganhos Brutos:</span>
                                            <span>{formatCurrency(item.earnings)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Gastos (Combustível):</span>
                                            <span className="text-red-500">- {formatCurrency(item.expense)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>Total de Entregas:</span>
                                            <span>{item.count}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-slate-300 dark:border-slate-600">
                                    <button 
                                        onClick={() => handleViewReport(item)}
                                        className="w-full flex items-center justify-center text-sm font-semibold p-2 rounded-lg text-brand-primary hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        {ICONS.DOCUMENT_TEXT}
                                        Ver Relatório
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {isReportModalOpen && selectedQuinzena && reportBreakdown && selectedQuinzenaData && (
                <ReportModal 
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    title={`Relatório - ${selectedQuinzena.id}`}
                    breakdown={reportBreakdown}
                    expense={selectedQuinzena.expense}
                    dailyData={selectedQuinzenaData}
                    monthKey={selectedQuinzena.monthKey}
                />
            )}
        </>
    );
};

export default History;