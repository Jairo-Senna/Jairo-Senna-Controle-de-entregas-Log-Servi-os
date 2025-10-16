import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
// FIX: Imported MonthData to correctly type month-specific data.
import { AllData, DetailedTotal, MonthData } from '../types';
import { getMonthKey, getQuinzena, getMonthName } from '../utils/dateUtils';
import { ICONS } from '../constants';
import { calculateEntryTotal, calculatePeriodTotals } from '../utils/calculationUtils';

interface SummaryProps {
  selectedDate: Date;
  allData: AllData;
  theme: 'light' | 'dark';
}

const Card: React.FC<{title: string, children: React.ReactNode, icon: React.ReactNode}> = ({ title, children, icon }) => (
    <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-brand-primary flex items-center mb-4">{icon}{title}</h3>
        {children}
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-200 dark:bg-slate-700 p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg">
        <p className="label text-slate-600 dark:text-slate-300">{`Dia ${label}`}</p>
        <p className="intro text-accent font-bold">{`Ganhos: ${payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</p>
      </div>
    );
  }
  return null;
};

const CustomMonthTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-200 dark:bg-slate-700 p-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg">
        <p className="label text-slate-600 dark:text-slate-300">{`${label}`}</p>
        <p className="intro text-accent font-bold">{`Ganhos: ${payload[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</p>
      </div>
    );
  }
  return null;
};


const Charts: React.FC<{ selectedDate: Date; allData: AllData; theme: 'light' | 'dark' }> = ({ selectedDate, allData, theme }) => {
    const chartColors = {
        grid: theme === 'light' ? '#e2e8f0' : '#334155',
        text: theme === 'light' ? '#334155' : '#e2e8f0',
        barFill: '#FB923C', // Orange 400
        lineStroke: '#F97316', // Orange 500
        tooltipCursor: theme === 'light' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.2)',
    };

    const dailyChartData = useMemo(() => {
        const monthKey = getMonthKey(selectedDate);
        // FIX: Cast monthData to MonthData to ensure correct type inference for its properties.
        const monthData = (allData[monthKey] || {}) as MonthData;
        const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
        
        return Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const entry = monthData[day];
            const { earnings } = calculateEntryTotal(entry);
            return { day, earnings };
        });
    }, [selectedDate, allData]);

    const monthlyChartData = useMemo(() => {
        const data = [];
        const date = new Date(selectedDate);
        date.setDate(1);

        for(let i=0; i < 12; i++) {
            const monthKey = getMonthKey(date);
            // FIX: Cast monthData to MonthData to ensure correct type inference for Object.values.
            const monthData = (allData[monthKey] || {}) as MonthData;
            let monthTotal = 0;
            Object.values(monthData).forEach(entry => {
                monthTotal += calculateEntryTotal(entry).earnings;
            });
            data.push({
                month: date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
                earnings: monthTotal
            });
            date.setMonth(date.getMonth() - 1);
        }
        return data.reverse();
    }, [selectedDate, allData]);

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-2">Ganhos diários em {getMonthName(selectedDate)}</h4>
                 <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dailyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="day" stroke={chartColors.text} fontSize={12} />
                        <YAxis stroke={chartColors.text} fontSize={12} tickFormatter={(value) => `R$${value}`}/>
                        <Tooltip content={<CustomTooltip />} cursor={{fill: chartColors.tooltipCursor}} />
                        <Legend />
                        <Bar dataKey="earnings" fill={chartColors.barFill} name="Ganhos"/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div>
                 <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-2">Ganhos Mensais (Últimos 12 meses)</h4>
                 <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                         <XAxis dataKey="month" stroke={chartColors.text} fontSize={12} />
                         <YAxis stroke={chartColors.text} fontSize={12} tickFormatter={(value) => `R$${value}`}/>
                         <Tooltip content={<CustomMonthTooltip />} />
                         <Legend />
                         <Line type="monotone" dataKey="earnings" stroke={chartColors.lineStroke} strokeWidth={2} name="Ganhos" dot={{ r: 4 }} activeDot={{ r: 8 }}/>
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const Breakdown: React.FC<{ data: DetailedTotal }> = ({ data }) => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-3 text-sm">
            <div className="flex justify-between items-baseline">
                <span className="text-slate-500 dark:text-slate-400">Normais:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {data.normal.count} entregas ({formatCurrency(data.normal.earnings)})
                </span>
            </div>
             <div className="flex justify-between items-baseline">
                <span className="text-slate-500 dark:text-slate-400">Expressas:</span>
                 <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {data.express.count} entregas ({formatCurrency(data.express.earnings)})
                </span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 mt-3 pt-3 flex justify-between items-baseline">
                 <span className="font-bold text-slate-800 dark:text-slate-200">Total:</span>
                 <div className="text-right">
                     <p className="text-xl font-bold text-accent">{formatCurrency(data.total.earnings)}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400">{data.total.count} entregas</p>
                 </div>
            </div>
        </div>
    );
};

const EarningsPercentageBreakdown: React.FC<{ data: DetailedTotal }> = ({ data }) => {
    const { total, normal, express } = data;

    if (total.earnings === 0) {
        return null; 
    }

    const normalPercentage = (normal.earnings / total.earnings) * 100;
    const expressPercentage = (express.earnings / total.earnings) * 100;

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h5 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Distribuição de Ganhos</h5>
            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-5 overflow-hidden flex text-white text-xs font-bold items-center justify-center">
                <div
                    className="bg-brand-secondary h-full flex items-center justify-center transition-all duration-500"
                    style={{ width: `${normalPercentage}%` }}
                    title={`Normal: ${formatCurrency(normal.earnings)} (${normalPercentage.toFixed(1)}%)`}
                >
                   {normalPercentage > 15 && <span className="px-1">{normalPercentage.toFixed(0)}%</span>}
                </div>
                <div
                    className="bg-brand-primary h-full flex items-center justify-center transition-all duration-500"
                    style={{ width: `${expressPercentage}%` }}
                    title={`Expressa: ${formatCurrency(express.earnings)} (${expressPercentage.toFixed(1)}%)`}
                >
                   {expressPercentage > 15 && <span className="px-1">{expressPercentage.toFixed(0)}%</span>}
                </div>
            </div>
            <div className="flex justify-between text-xs mt-2 text-slate-500 dark:text-slate-400">
                <div className="text-left">
                    <span className="inline-block w-2 h-2 rounded-full bg-brand-secondary mr-1 align-middle"></span>
                    Normal ({formatCurrency(normal.earnings)})
                </div>
                <div className="text-right">
                    Expressa ({formatCurrency(express.earnings)})
                    <span className="inline-block w-2 h-2 rounded-full bg-brand-primary ml-1 align-middle"></span>
                </div>
            </div>
        </div>
    );
};

const DailyEarningsTypeChart: React.FC<{ data: DetailedTotal; theme: 'light' | 'dark' }> = ({ data, theme }) => {
    if (data.total.earnings === 0) {
        return (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400">
                <p className="py-10">Sem ganhos registrados para este dia.</p>
            </div>
        );
    }

    const chartData = [
        { name: 'Normal', Ganhos: data.normal.earnings },
        { name: 'Expressa', Ganhos: data.express.earnings },
    ];

    const chartColors = {
        grid: theme === 'light' ? '#e2e8f0' : '#334155',
        text: theme === 'light' ? '#334155' : '#e2e8f0',
        barFillNormal: '#FB923C', // Orange 400
        barFillExpress: '#F97316', // Orange 500
        tooltipCursor: theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    };

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h5 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Distribuição de Ganhos</h5>
            <ResponsiveContainer width="100%" height={150}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis dataKey="name" stroke={chartColors.text} fontSize={12} />
                    <YAxis stroke={chartColors.text} fontSize={12} tickFormatter={(value) => `${formatCurrency(value)}`} />
                    <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Ganhos']}
                        cursor={{ fill: chartColors.tooltipCursor }}
                        contentStyle={{
                            backgroundColor: theme === 'light' ? '#ffffff' : '#1e293b',
                            border: `1px solid ${theme === 'light' ? '#e2e8f0' : '#334155'}`,
                            borderRadius: '0.5rem'
                        }}
                    />
                    <Bar dataKey="Ganhos" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? chartColors.barFillNormal : chartColors.barFillExpress} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const Summary: React.FC<SummaryProps> = ({ selectedDate, allData, theme }) => {
    
    const { daily, quinzena, monthly } = useMemo(() => {
        const monthKey = getMonthKey(selectedDate);
        // FIX: Cast monthData to MonthData to ensure correct type inference for Object.values.
        const monthData = (allData[monthKey] || {}) as MonthData;
        const currentQuinzena = getQuinzena(selectedDate);

        // Daily
        const dailyEntry = monthData[selectedDate.getDate()];
        const dailyTotals = calculatePeriodTotals(dailyEntry ? [dailyEntry] : []);

        // Quinzena
        const quinzenaEntries = [];
        const startDay = currentQuinzena === 1 ? 1 : 16;
        const endDay = currentQuinzena === 1 ? 15 : 31;
        for (let i = startDay; i <= endDay; i++) {
            if (monthData[i]) {
                quinzenaEntries.push(monthData[i]);
            }
        }
        const quinzenaTotals = calculatePeriodTotals(quinzenaEntries);

        // Monthly
        const monthlyEntries = Object.values(monthData);
        const monthlyTotals = calculatePeriodTotals(monthlyEntries);
        
        return { daily: dailyTotals, quinzena: quinzenaTotals, monthly: monthlyTotals };
    }, [selectedDate, allData]);

    return (
        <div className="space-y-8">
            <Card title="Resumo do Dia" icon={ICONS.CALENDAR}>
                <Breakdown data={daily} />
                <DailyEarningsTypeChart data={daily} theme={theme} />
            </Card>

            <Card title={`${getQuinzena(selectedDate)}ª Quinzena`} icon={ICONS.CALENDAR}>
                <Breakdown data={quinzena} />
                <EarningsPercentageBreakdown data={quinzena} />
            </Card>

            <Card title={`Total de ${getMonthName(selectedDate)}`} icon={ICONS.DOLLAR}>
                 <Breakdown data={monthly} />
                 <EarningsPercentageBreakdown data={monthly} />
            </Card>

            <Card title="Gráficos de Desempenho" icon={ICONS.CHART_BAR}>
                <Charts selectedDate={selectedDate} allData={allData} theme={theme} />
            </Card>
        </div>
    );
};

export default Summary;