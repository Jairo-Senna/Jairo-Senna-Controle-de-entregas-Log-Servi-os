
import React, { useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { AllData, MonthData, DeliveryType } from '../types';
import { getMonthKey, getMonthName } from '../utils/dateUtils';
import { ICONS, RATES, DELIVERY_TYPE_NAMES } from '../constants';
import { calculateEntryTotal, migrateEntry } from '../utils/calculationUtils';

interface PerformanceChartsProps {
  selectedDate: Date;
  allData: AllData;
  theme: 'light' | 'dark';
}

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

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent * 100 < 5) return null;

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ selectedDate, allData, theme }) => {
    const chartColors = {
        grid: theme === 'light' ? '#e2e8f0' : '#334155',
        text: theme === 'light' ? '#334155' : '#e2e8f0',
        barFill: '#FB923C', // Orange 400
        lineStroke: '#F97316', // Orange 500
        tooltipCursor: theme === 'light' ? 'rgba(251, 146, 60, 0.2)' : 'rgba(251, 146, 60, 0.2)',
    };

    const PIE_COLORS = ['#F97316', '#FB923C', '#FDBA74', '#FED7AA'];

    const dailyChartData = useMemo(() => {
        const monthKey = getMonthKey(selectedDate);
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

    const monthlyTypeBreakdownData = useMemo(() => {
        const monthKey = getMonthKey(selectedDate);
        const monthData = (allData[monthKey] || {}) as MonthData;
        const totals = {
            [DeliveryType.FLASH]: 0,
            [DeliveryType.INTERLOG]: 0,
            [DeliveryType.ECOMMERCE]: 0,
            [DeliveryType.LOGGI]: 0,
        };

        for (const day in monthData) {
            const entry = migrateEntry(monthData[day]);
            totals[DeliveryType.FLASH] += (entry.flash.normal * RATES.NORMAL.flash) + (entry.flash.express * RATES.EXPRESS.flash);
            totals[DeliveryType.INTERLOG] += (entry.interlog.normal * RATES.NORMAL.interlog) + (entry.interlog.express * RATES.EXPRESS.interlog);
            totals[DeliveryType.ECOMMERCE] += (entry.ecommerce.normal * RATES.NORMAL.ecommerce) + (entry.ecommerce.express * RATES.EXPRESS.ecommerce);
            totals[DeliveryType.LOGGI] += (entry.loggi.normal * RATES.NORMAL.loggi) + (entry.loggi.express * RATES.EXPRESS.loggi);
        }
        
        return Object.entries(totals)
            .map(([type, earnings]) => ({
                name: DELIVERY_TYPE_NAMES[type as DeliveryType],
                value: earnings,
            }))
            .filter(item => item.value > 0);
    }, [selectedDate, allData]);


    return (
        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-brand-primary flex items-center mb-4">{ICONS.CHART_BAR}Gráficos de Desempenho</h3>
            <div className="space-y-8">
                <div>
                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-2">Ganhos por Tipo de Entrega em {getMonthName(selectedDate)}</h4>
                     {monthlyTypeBreakdownData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                             <PieChart>
                                <Pie
                                    data={monthlyTypeBreakdownData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {monthlyTypeBreakdownData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-10">Sem dados de ganhos neste mês para exibir o gráfico.</p>
                    )}
                </div>
                <div>
                    <h4 className="text-md font-semibold text-slate-600 dark:text-slate-300 mb-2">Ganhos diários em {getMonthName(selectedDate)}</h4>
                     <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={dailyChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis dataKey="day" stroke={chartColors.text} fontSize={12} />
                            <YAxis stroke={chartColors.text} fontSize={12} tickFormatter={(value) => `R$${value}`}/>
                            <Tooltip content={<CustomTooltip />} cursor={{fill: chartColors.tooltipCursor}} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
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
                             <Legend wrapperStyle={{ paddingTop: '10px' }} />
                             <Line type="monotone" dataKey="earnings" stroke={chartColors.lineStroke} strokeWidth={2} name="Ganhos" dot={{ r: 4 }} activeDot={{ r: 8 }}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default PerformanceCharts;