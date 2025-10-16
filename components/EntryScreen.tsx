import React, { useState } from 'react';
import Calendar from './Calendar';
import EntryForm from './EntryForm';
import { DailyEntry, MonthData, OldDailyEntry } from '../types';
import { ICONS } from '../constants';

interface EntryScreenProps {
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  monthData: MonthData;
  onSave: (entry: DailyEntry, date: Date) => void;
  initialData?: DailyEntry | OldDailyEntry;
  onDelete: (date: Date) => void;
}

const EntryScreen: React.FC<EntryScreenProps> = (props) => {
  const [lastUpdatedDay, setLastUpdatedDay] = useState<number | null>(null);

  const handleDateChangeWithReset = (date: Date) => {
    setLastUpdatedDay(null);
    props.onDateChange(date);
  };

  const handleSaveWrapper = (entry: DailyEntry) => {
    props.onSave(entry, props.selectedDate);
    setLastUpdatedDay(props.selectedDate.getDate());
  };

  const handleDeleteWrapper = () => {
    props.onDelete(props.selectedDate);
    setLastUpdatedDay(props.selectedDate.getDate());
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 z-50 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="relative mb-8 text-center">
          <button
            onClick={props.onClose}
            className="absolute top-0 left-0 flex items-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold"
            aria-label="Voltar para o dashboard"
          >
            {ICONS.CHEVRON_LEFT}
            <span className="ml-1">Voltar</span>
          </button>
          <h1 className="text-2xl font-bold text-brand-primary">
            Registro de Entregas
          </h1>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg shadow-lg">
              <Calendar
                selectedDate={props.selectedDate}
                onDateChange={handleDateChangeWithReset}
                monthData={props.monthData}
                lastUpdatedDay={lastUpdatedDay}
              />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg shadow-lg">
              <EntryForm
                selectedDate={props.selectedDate}
                onSave={handleSaveWrapper}
                initialData={props.initialData}
                onDelete={handleDeleteWrapper}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EntryScreen;