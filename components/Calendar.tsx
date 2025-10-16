import React, { useState, useMemo } from 'react';
import { getDaysInMonth, getMonthName } from '../utils/dateUtils';
import { ICONS } from '../constants';
import { MonthData } from '../types';

interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  monthData: MonthData;
  lastUpdatedDay?: number | null;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateChange, monthData, lastUpdatedDay }) => {
  const [displayDate, setDisplayDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const daysInMonth = useMemo(() => getDaysInMonth(displayDate), [displayDate]);
  const firstDayOfMonth = useMemo(() => daysInMonth[0].getDay(), [daysInMonth]);

  const changeMonth = (offset: number) => {
    setDisplayDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
  };

  const today = new Date();
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => changeMonth(-1)} 
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Mês anterior"
        >
          {ICONS.CHEVRON_LEFT}
        </button>
        <h2 className="text-xl font-semibold capitalize text-slate-800 dark:text-slate-200">{getMonthName(displayDate)}</h2>
        <button 
          onClick={() => changeMonth(1)} 
          className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Próximo mês"
        >
          {ICONS.CHEVRON_RIGHT}
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map(day => <div key={day} className="font-bold text-sm text-slate-500 dark:text-slate-400">{day}</div>)}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
        {daysInMonth.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const hasEntry = !!monthData[day.getDate()];
          const isLastUpdated = day.getDate() === lastUpdatedDay && displayDate.getMonth() === selectedDate.getMonth();

          const baseClasses = "w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-all duration-200";
          const selectedClasses = "bg-brand-primary text-white font-bold shadow-md";
          const todayClasses = "border-2 border-brand-secondary";
          const defaultClasses = "hover:bg-slate-200 dark:hover:bg-slate-700";
          const updatedClasses = isLastUpdated ? "animate-highlight" : "";
          
          let dayClasses = `${baseClasses} ${defaultClasses} ${updatedClasses}`;
          if (isSelected) dayClasses = `${baseClasses} ${selectedClasses} ${updatedClasses}`;
          else if (isToday) dayClasses = `${baseClasses} ${todayClasses} ${defaultClasses} ${updatedClasses}`;
          
          return (
            <div key={day.toString()} className="flex justify-center items-center">
                <div onClick={() => onDateChange(day)} className={dayClasses}>
                  <span>{day.getDate()}</span>
                  {hasEntry && !isSelected && <div className="absolute mt-6 w-1.5 h-1.5 bg-accent rounded-full"></div>}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;