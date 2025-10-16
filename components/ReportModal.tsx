import React, { useMemo } from 'react';
import { BreakdownByType, MonthData, DailyEntry, OldDailyEntry } from '../types';
import { ICONS } from '../constants';
import { calculateEntryTotal, migrateEntry } from '../utils/calculationUtils';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  breakdown: BreakdownByType;
  expense: number;
  dailyData: MonthData;
  monthKey: string;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Stat = ({ label, value, icon, className = '' }: { label: string, value: string | number, icon: React.ReactNode, className?: string }) => (
    <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg text-center flex flex-col justify-center">
        <div className={`mx-auto h-8 w-8 flex items-center justify-center rounded-full text-brand-primary mb-2 ${className}`}>
            {icon}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800 dark:text-slate-200 break-words">{value}</p>
    </div>
);


const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, title, breakdown, expense, dailyData, monthKey }) => {
  if (!isOpen) return null;
  
  const { grandTotal } = breakdown;
  const netEarnings = grandTotal.total.earnings - expense;

  const handlePrint = () => {
    window.print();
  };

  const dailyEntries = useMemo(() => {
    return Object.entries(dailyData)
        .map(([day, entry]) => ({ day: parseInt(day, 10), entry: migrateEntry(entry as DailyEntry | OldDailyEntry) }))
        .sort((a, b) => a.day - b.day);
  }, [dailyData]);

  const [year, month] = monthKey.split('-').map(Number);

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col print:max-h-none print:h-auto print:shadow-none print:rounded-none" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 print:hidden">
          <h2 className="text-xl font-bold text-brand-primary">Relatório de Desempenho</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Fechar relatório"
          >
            {ICONS.X_MARK}
          </button>
        </header>
        
        <div id="report-content" className="p-6 overflow-y-auto print:overflow-visible">
            <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                <p className="text-slate-500 dark:text-slate-400">Resumo da quinzena</p>
            </div>

            <section className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Ganhos Brutos" value={formatCurrency(grandTotal.total.earnings)} icon={ICONS.DOLLAR} />
                <Stat label="Gastos" value={formatCurrency(expense)} icon={ICONS.FUEL} className="text-red-500"/>
                <Stat label="Ganhos Líquidos" value={formatCurrency(netEarnings)} icon={ICONS.DOLLAR} className="text-green-500"/>
                <Stat label="Total Entregas" value={grandTotal.total.count} icon={ICONS.PACKAGE} />
            </section>

            <section>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-4">
                    Detalhes por Dia
                </h3>
                <div className="space-y-2">
                    {dailyEntries.length > 0 ? dailyEntries.map(({ day, entry }) => {
                        const { earnings } = calculateEntryTotal(entry);
                        const deliveryCounts = {
                            flash: entry.flash.normal + entry.flash.express,
                            interlog: entry.interlog.normal + entry.interlog.express,
                            ecommerce: entry.ecommerce.normal + entry.ecommerce.express,
                            loggi: entry.loggi.normal + entry.loggi.express
                        };
                        const date = new Date(year, month - 1, day);
                        const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                        const deliveryStrings = [];
                        if (deliveryCounts.flash > 0) deliveryStrings.push(`${deliveryCounts.flash} flash`);
                        if (deliveryCounts.interlog > 0) deliveryStrings.push(`${deliveryCounts.interlog} interlog`);
                        if (deliveryCounts.ecommerce > 0) deliveryStrings.push(`${deliveryCounts.ecommerce} ecommerce`);
                        if (deliveryCounts.loggi > 0) deliveryStrings.push(`${deliveryCounts.loggi} loggi`);
                        
                        return (
                            <div key={day} className="grid grid-cols-2 sm:grid-cols-[2fr_3fr_2fr] items-center gap-x-4 gap-y-1 p-3 rounded-lg bg-slate-100 dark:bg-slate-700/50 break-inside-avoid">
                                <div className="col-span-2 sm:col-span-1">
                                    <span className="font-bold text-base text-slate-800 dark:text-slate-200">
                                        Dia {day}
                                    </span>
                                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">
                                        ({formattedDate})
                                    </span>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-300 sm:text-center col-span-1 sm:col-span-1">
                                    {deliveryStrings.join(' • ') || 'Sem entregas'}
                                </div>
                                <div className="font-semibold text-lg text-accent text-right col-span-1 sm:col-span-1">
                                    {formatCurrency(earnings)}
                                </div>
                            </div>
                        );
                    }) : (
                         <p className="text-center text-slate-500 dark:text-slate-400 py-6">
                            Nenhum registro de entrega encontrado para esta quinzena.
                        </p>
                    )}
                </div>
                 <div className="mt-6 pt-4 border-t-2 border-slate-300 dark:border-slate-600 flex justify-end items-baseline">
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-200">Total da Quinzena:</span>
                    <span className="text-2xl font-bold text-accent ml-4">{formatCurrency(grandTotal.total.earnings)}</span>
                </div>
            </section>
        </div>

        <footer className="p-4 mt-auto border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4 print:hidden">
            <button
                onClick={handlePrint}
                className="flex items-center justify-center px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
            >
                Imprimir
            </button>
            <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors"
            >
                Fechar
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ReportModal;