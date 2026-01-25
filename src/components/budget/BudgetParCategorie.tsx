import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';
import { useBudgetParCategorie } from '@/hooks';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BUDGET_CATEGORY_LABELS, type BudgetCategory } from '@/types';

export function BudgetParCategorie() {
  const budgetByCategory = useBudgetParCategorie();

  const data = Object.entries(budgetByCategory).map(([category, values]) => ({
    name: BUDGET_CATEGORY_LABELS[category as BudgetCategory],
    prevu: values.prevu,
    engage: values.engage,
    realise: values.realise,
  }));

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-primary-900 mb-4">
        Budget par catégorie
      </h3>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e4e4e7' }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e4e4e7' }}
              tickFormatter={(value) => `${formatNumber(value / 1000000)}M`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e4e4e7',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="prevu" name="Prévu" fill="#71717a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="engage" name="Engagé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realise" name="Réalisé" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
