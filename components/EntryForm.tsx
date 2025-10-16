import React, { useState, useEffect } from 'react';
import { DailyEntry, DeliveryType, DeliveryCount, OldDailyEntry } from '../types';
import { getFormattedDate } from '../utils/dateUtils';
import { DELIVERY_TYPE_NAMES, DELIVERY_ICONS } from '../constants';
import { migrateEntry } from '../utils/calculationUtils';

interface EntryFormProps {
  selectedDate: Date;
  onSave: (entry: DailyEntry) => void;
  initialData?: DailyEntry | OldDailyEntry;
  onDelete: () => void;
}

// A new type for form state with string values
type FormValues = {
  [key in DeliveryType]: {
    normal: string;
    express: string;
  };
};

const EntryForm: React.FC<EntryFormProps> = ({ selectedDate, onSave, initialData, onDelete }) => {
  const emptyEntry: DailyEntry = {
    [DeliveryType.FLASH]: { normal: 0, express: 0 },
    [DeliveryType.INTERLOG]: { normal: 0, express: 0 },
    [DeliveryType.ECOMMERCE]: { normal: 0, express: 0 },
    [DeliveryType.LOGGI]: { normal: 0, express: 0 },
  };

  const emptyFormValues: FormValues = {
    [DeliveryType.FLASH]: { normal: '', express: '' },
    [DeliveryType.INTERLOG]: { normal: '', express: '' },
    [DeliveryType.ECOMMERCE]: { normal: '', express: '' },
    [DeliveryType.LOGGI]: { normal: '', express: '' },
  };
  
  const [formValues, setFormValues] = useState<FormValues>(emptyFormValues);

  useEffect(() => {
    const data = initialData ? migrateEntry(initialData) : emptyEntry;
    
    const newFormValues: FormValues = {
      [DeliveryType.FLASH]: {
        normal: data.flash.normal > 0 ? String(data.flash.normal) : '',
        express: data.flash.express > 0 ? String(data.flash.express) : '',
      },
      [DeliveryType.INTERLOG]: {
        normal: data.interlog.normal > 0 ? String(data.interlog.normal) : '',
        express: data.interlog.express > 0 ? String(data.interlog.express) : '',
      },
      [DeliveryType.ECOMMERCE]: {
        normal: data.ecommerce.normal > 0 ? String(data.ecommerce.normal) : '',
        express: data.ecommerce.express > 0 ? String(data.ecommerce.express) : '',
      },
      [DeliveryType.LOGGI]: {
        normal: data.loggi.normal > 0 ? String(data.loggi.normal) : '',
        express: data.loggi.express > 0 ? String(data.loggi.express) : '',
      },
    };

    setFormValues(newFormValues);
  }, [selectedDate, initialData]);

  const handleChange = (type: DeliveryType, subType: keyof DeliveryCount, value: string) => {
    // Allow only non-negative integers
    if (/^\d*$/.test(value)) {
        // Prevent leading zeros unless it's just "0"
        const sanitizedValue = value.length > 1 && value.startsWith('0') ? value.substring(1) : value;
        setFormValues(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [subType]: sanitizedValue
            }
        }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entryToSave: DailyEntry = JSON.parse(JSON.stringify(emptyEntry));
    for (const type of Object.values(DeliveryType)) {
        entryToSave[type].normal = Number(formValues[type].normal) || 0;
        entryToSave[type].express = Number(formValues[type].express) || 0;
    }

    onSave(entryToSave);
  };

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir os registros do dia ${getFormattedDate(selectedDate)}? Esta ação não pode ser desfeita.`)) {
      onDelete();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-primary">
        {initialData ? 'Editar Entregas' : 'Registrar Entregas'} para <span className="text-accent">{getFormattedDate(selectedDate)}</span>
      </h2>
      
      {Object.values(DeliveryType).map(type => (
         <div key={type} className="p-4 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg">
            <label className="flex items-center text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">
              <span className="mr-2 text-brand-primary">{DELIVERY_ICONS[type]}</span>
              {DELIVERY_TYPE_NAMES[type]}
            </label>
            {type === DeliveryType.ECOMMERCE || type === DeliveryType.LOGGI ? (
              <div>
                <label htmlFor={`${type}-normal`} className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Quantidade</label>
                 <input
                  type="number"
                  id={`${type}-normal`}
                  name={`${type}-normal`}
                  value={formValues[type]?.normal}
                  onChange={(e) => handleChange(type, 'normal', e.target.value)}
                  className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-800 dark:text-slate-200 focus:ring-brand-primary focus:border-brand-primary transition"
                  min="0"
                  placeholder="0"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${type}-normal`} className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Normais</label>
                  <input
                    type="number"
                    id={`${type}-normal`}
                    name={`${type}-normal`}
                    value={formValues[type]?.normal}
                    onChange={(e) => handleChange(type, 'normal', e.target.value)}
                    className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-800 dark:text-slate-200 focus:ring-brand-primary focus:border-brand-primary transition"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor={`${type}-express`} className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Expressas</label>
                  <input
                    type="number"
                    id={`${type}-express`}
                    name={`${type}-express`}
                    value={formValues[type]?.express}
                    onChange={(e) => handleChange(type, 'express', e.target.value)}
                    className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-800 dark:text-slate-200 focus:ring-brand-primary focus:border-brand-primary transition"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
         </div>
      ))}

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <button
          type="submit"
          className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg"
        >
          {initialData ? 'Atualizar Entregas' : 'Salvar Entregas'}
        </button>
        {initialData && (
           <button
            type="button"
            onClick={handleDelete}
            className="w-full bg-transparent hover:bg-red-500 text-red-500 font-semibold hover:text-white py-3 px-4 border border-red-500 hover:border-transparent rounded-lg transition-colors"
          >
            Excluir
          </button>
        )}
      </div>
    </form>
  );
};

export default EntryForm;