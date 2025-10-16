import React, { useState, useMemo, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import EntryScreen from './components/EntryScreen';
import PerformanceCharts from './components/PerformanceCharts';
import Sidebar from './components/Sidebar';
import History from './components/History';
import FloatingActionButton from './components/FloatingActionButton';
import FuelExpenseModal from './components/FuelExpenseModal';
import Toast from './components/Toast'; // Import Toast
import useLocalStorage from './hooks/useLocalStorage';
import useTheme from './hooks/useTheme';
import { AllData, DailyEntry, ExpenseData } from './types';
import { getMonthKey, getQuinzena, getFormattedDate } from './utils/dateUtils';
import { ICONS } from './constants';
import { calculatePeriodTotals } from './utils/calculationUtils';

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useLocalStorage<AllData>('deliveryData', {});
  const [expenses, setExpenses] = useLocalStorage<ExpenseData>('fuelExpenses', {});
  const [theme, toggleTheme] = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const currentMonthKeyForCalendar = useMemo(() => getMonthKey(selectedDate), [selectedDate]);
  const currentMonthDataForCalendar = useMemo(() => data[currentMonthKeyForCalendar] || {}, [data, currentMonthKeyForCalendar]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSaveEntry = useCallback((entry: DailyEntry, date: Date) => {
    const day = date.getDate();
    const monthKey = getMonthKey(date);
    
    setData(prevData => {
        const newData = { ...prevData };
        const newMonthData = { ...(newData[monthKey] || {}) };
        const isUpdating = !!newMonthData[day];
        newMonthData[day] = entry;
        newData[monthKey] = newMonthData;
        showToast(`Entregas ${isUpdating ? 'atualizadas' : 'salvas'} para ${getFormattedDate(date)}!`);
        return newData;
    });
  }, [setData]);

  const handleDeleteEntry = useCallback((date: Date) => {
    const day = date.getDate();
    const monthKey = getMonthKey(date);

    setData(prevData => {
        const newData = { ...prevData };
        if (!newData[monthKey]) return prevData;

        const newMonthData = { ...newData[monthKey] };
        delete newMonthData[day];

        if (Object.keys(newMonthData).length === 0) {
            delete newData[monthKey];
        } else {
            newData[monthKey] = newMonthData;
        }
        showToast(`Registro de ${getFormattedDate(date)} excluído.`, 'error');
        return newData;
    });
  }, [setData]);

  const handleClearData = useCallback(() => {
    if (window.confirm('Você tem certeza que deseja apagar TODOS os seus dados? Esta ação não pode ser desfeita.')) {
      setData({});
      setExpenses({});
      setIsSidebarOpen(false);
      showToast('Todos os dados foram apagados.', 'error');
    }
  }, [setData, setExpenses]);
  
  const handleWhatsAppHelp = () => {
    const phoneNumber = '5582981467725';
    const message = encodeURIComponent('Olá! Preciso de ajuda com o aplicativo de Controle de Entregas.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleSaveFuelExpense = useCallback((amount: number) => {
      const today = new Date();
      const monthKey = getMonthKey(today);
      const quinzena = getQuinzena(today);
      const quinzenaKey = `${monthKey}-${quinzena}`;

      setExpenses(prev => ({
          ...prev,
          [quinzenaKey]: (prev[quinzenaKey] || 0) + amount,
      }));
      setIsFuelModalOpen(false);
      showToast('Gasto com combustível salvo!');
  }, [setExpenses]);

  const { quinzenaTotals, monthlyTotals, quinzenaExpense, monthlyExpense } = useMemo(() => {
    const today = new Date();
    const monthKey = getMonthKey(today);
    const monthData = data[monthKey] || {};
    const currentQuinzena = getQuinzena(today);
    const startDay = currentQuinzena === 1 ? 1 : 16;
    const endDay = currentQuinzena === 1 ? 15 : 31;
    
    const quinzenaEntries = [];
    const monthlyEntries = [];

    Object.entries(monthData).forEach(([day, entry]) => {
        monthlyEntries.push(entry);
        const dayNum = parseInt(day, 10);
        if (dayNum >= startDay && dayNum <= endDay) {
            quinzenaEntries.push(entry);
        }
    });

    const qTotals = calculatePeriodTotals(quinzenaEntries);
    const mTotals = calculatePeriodTotals(monthlyEntries);

    const quinzenaKey = `${monthKey}-${currentQuinzena}`;
    const firstQuinzenaKey = `${monthKey}-1`;
    const secondQuinzenaKey = `${monthKey}-2`;
    
    const qExpense = expenses[quinzenaKey] || 0;
    const mExpense = (expenses[firstQuinzenaKey] || 0) + (expenses[secondQuinzenaKey] || 0);
    
    return { 
        quinzenaTotals: qTotals, 
        monthlyTotals: mTotals,
        quinzenaExpense: qExpense,
        monthlyExpense: mExpense,
    };
  }, [data, expenses]);

  return (
    <>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
      >
        <History allData={data} expenses={expenses} />
        <div className="mt-auto p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
           <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-center p-3 rounded-lg text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? ICONS.MOON : ICONS.SUN}
            <span className="ml-2 font-semibold">
              Mudar para tema {theme === 'light' ? 'Escuro' : 'Claro'}
            </span>
          </button>
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-center p-3 rounded-lg text-red-500 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-semibold"
          >
            {ICONS.TRASH}
            Limpar Todos os Dados
          </button>
        </div>
      </Sidebar>
      
      {isAddingEntry ? (
        <EntryScreen
          onClose={() => setIsAddingEntry(false)}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          monthData={currentMonthDataForCalendar}
          onSave={handleSaveEntry}
          initialData={currentMonthDataForCalendar[selectedDate.getDate()]}
          onDelete={handleDeleteEntry}
        />
      ) : (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <header className="relative mb-8 flex items-center justify-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute left-0 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Abrir menu"
              >
                {ICONS.MENU}
              </button>
              <div className="flex items-center">
                <span className="h-7 w-7 text-brand-primary">
                  {ICONS.ENVELOPE}
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold ml-3 text-slate-800 dark:text-slate-200">
                  Controle de Entregas
                </h1>
              </div>
            </header>

            <main className="space-y-8">
               <Dashboard 
                onAddEntry={() => setIsAddingEntry(true)}
                onAddExpense={() => setIsFuelModalOpen(true)}
                quinzenaTotal={quinzenaTotals}
                monthlyTotal={monthlyTotals}
                quinzenaExpense={quinzenaExpense}
                monthlyExpense={monthlyExpense}
                selectedDate={new Date()}
              />
               <PerformanceCharts 
                  selectedDate={selectedDate}
                  allData={data}
                  theme={theme}
               />
            </main>
          </div>
          <footer className="text-center text-slate-500 mt-12 text-sm">
                <p>Feito para entregadores. Seus dados são salvos apenas no seu dispositivo.</p>
            </footer>
        </div>
      )}
      <FloatingActionButton onClick={handleWhatsAppHelp} />
      <FuelExpenseModal 
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        onSave={handleSaveFuelExpense}
        currentValue={quinzenaExpense}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;