import React, { useState } from 'react';

interface FuelExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  currentValue: number;
}

const FuelExpenseModal: React.FC<FuelExpenseModalProps> = ({ isOpen, onClose, onSave, currentValue }) => {
  const [amount, setAmount] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!isNaN(value) && value > 0) {
      onSave(value);
      setAmount('');
    } else {
      alert('Por favor, insira um valor válido.');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-brand-primary mb-4">Adicionar Gasto com Combustível</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          O valor atual para esta quinzena é de {currentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. 
          O novo valor será somado a este total.
        </p>
        <form onSubmit={handleSubmit}>
          <label htmlFor="fuel-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Valor do Gasto (R$)
          </label>
          <input
            type="number"
            id="fuel-amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-slate-800 dark:text-slate-200 focus:ring-brand-primary focus:border-brand-primary transition"
            placeholder="Ex: 50.00"
            step="0.01"
            min="0"
            autoFocus
          />
          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors"
            >
              Salvar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FuelExpenseModal;
