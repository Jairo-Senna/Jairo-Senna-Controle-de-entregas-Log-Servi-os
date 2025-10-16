import React from 'react';
import { DetailedTotal } from '../types';
import { ICONS } from '../constants';
import { getQuinzena, getMonthName } from '../utils/dateUtils';

interface DashboardProps {
  onAddEntry: () => void;
  onAddExpense: () => void;
  quinzenaTotal: DetailedTotal;
  monthlyTotal: DetailedTotal;
  quinzenaExpense: number;
  monthlyExpense: number;
  selectedDate: Date;
}

const StatCard: React.FC<{ title: string; total: DetailedTotal; expense: number }> = ({ title, total, expense }) => {
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const netEarnings = total.total.earnings - expense;

  return (
    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col justify-between">
        <div>
            <h3 className="text-lg font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center">{title}</h3>
            <div className="text-center mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Ganhos Líquidos</p>
                <p className="text-4xl font-bold text-accent">{formatCurrency(netEarnings)}</p>
            </div>
        </div>
        <div className="text-sm space-y-2 border-t border-slate-200 dark:border-slate-600 pt-3 mt-3">
            <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ganhos Brutos:</span>
                <span className="font-semibold">{formatCurrency(total.total.earnings)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Combustível:</span>
                <span className="font-semibold text-red-500">- {formatCurrency(expense)}</span>
            </div>
             <div className="flex justify-between font-bold pt-1">
                <span>Total de Entregas:</span>
                <span>{total.total.count}</span>
            </div>
        </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ onAddEntry, onAddExpense, quinzenaTotal, monthlyTotal, quinzenaExpense, monthlyExpense, selectedDate }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard title={`${getQuinzena(selectedDate)}ª Quinzena`} total={quinzenaTotal} expense={quinzenaExpense} />
        <StatCard title={`Total de ${getMonthName(selectedDate)}`} total={monthlyTotal} expense={monthlyExpense} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onAddEntry}
          className="w-full flex items-center justify-center bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg text-base"
        >
          {ICONS.PLUS_CIRCLE}
          Adicionar Remessa
        </button>
         <button
          onClick={onAddExpense}
          className="w-full flex items-center justify-center bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg text-base"
        >
          {ICONS.FUEL}
          Adicionar Gasto
        </button>
      </div>
    </div>
  );
};

export default Dashboard;