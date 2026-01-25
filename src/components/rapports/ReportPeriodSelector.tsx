/**
 * Report Period Selector
 * Sélecteur de période réutilisable pour tous les rapports
 */

import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Button, Input, Select, SelectOption } from '@/components/ui';
import { cn } from '@/lib/utils';

export type PeriodType = 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'custom';

export interface ReportPeriod {
  type: PeriodType;
  label: string;
  startDate: string;
  endDate: string;
  displayText: string;
}

interface ReportPeriodSelectorProps {
  value: ReportPeriod | null;
  onChange: (period: ReportPeriod) => void;
  className?: string;
  compact?: boolean;
}

const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
  week: 'Semaine',
  month: 'Mois',
  quarter: 'Trimestre',
  semester: 'Semestre',
  year: 'Année',
  custom: 'Personnalisé',
};

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const QUARTERS = ['T1', 'T2', 'T3', 'T4'];
const SEMESTERS = ['S1', 'S2'];

export function ReportPeriodSelector({
  value,
  onChange,
  className,
  compact = false,
}: ReportPeriodSelectorProps) {
  const [periodType, setPeriodType] = useState<PeriodType>(value?.type || 'month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
  const [selectedQuarter, setSelectedQuarter] = useState(Math.floor(new Date().getMonth() / 3));
  const [selectedSemester, setSelectedSemester] = useState(new Date().getMonth() < 6 ? 0 : 1);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Generate years (current year - 2 to current year + 1)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  }, []);

  // Generate weeks for selected year
  const weeks = useMemo(() => {
    const result = [];
    for (let i = 1; i <= 52; i++) {
      result.push(i);
    }
    return result;
  }, []);

  const handleApply = () => {
    let period: ReportPeriod;

    switch (periodType) {
      case 'week': {
        const { start, end } = getWeekDates(selectedYear, selectedWeek);
        period = {
          type: 'week',
          label: `Semaine ${selectedWeek}`,
          startDate: start,
          endDate: end,
          displayText: `Semaine ${selectedWeek} - ${selectedYear}`,
        };
        break;
      }
      case 'month': {
        const start = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const end = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${lastDay}`;
        period = {
          type: 'month',
          label: MONTHS[selectedMonth],
          startDate: start,
          endDate: end,
          displayText: `${MONTHS[selectedMonth]} ${selectedYear}`,
        };
        break;
      }
      case 'quarter': {
        const startMonth = selectedQuarter * 3;
        const endMonth = startMonth + 2;
        const start = `${selectedYear}-${String(startMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, endMonth + 1, 0).getDate();
        const end = `${selectedYear}-${String(endMonth + 1).padStart(2, '0')}-${lastDay}`;
        period = {
          type: 'quarter',
          label: QUARTERS[selectedQuarter],
          startDate: start,
          endDate: end,
          displayText: `${QUARTERS[selectedQuarter]} ${selectedYear}`,
        };
        break;
      }
      case 'semester': {
        const startMonth = selectedSemester * 6;
        const endMonth = startMonth + 5;
        const start = `${selectedYear}-${String(startMonth + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(selectedYear, endMonth + 1, 0).getDate();
        const end = `${selectedYear}-${String(endMonth + 1).padStart(2, '0')}-${lastDay}`;
        period = {
          type: 'semester',
          label: SEMESTERS[selectedSemester],
          startDate: start,
          endDate: end,
          displayText: `${SEMESTERS[selectedSemester]} ${selectedYear}`,
        };
        break;
      }
      case 'year': {
        period = {
          type: 'year',
          label: String(selectedYear),
          startDate: `${selectedYear}-01-01`,
          endDate: `${selectedYear}-12-31`,
          displayText: `Année ${selectedYear}`,
        };
        break;
      }
      case 'custom': {
        if (!customStart || !customEnd) return;
        const startDate = new Date(customStart);
        const endDate = new Date(customEnd);
        period = {
          type: 'custom',
          label: 'Personnalisé',
          startDate: customStart,
          endDate: customEnd,
          displayText: `Du ${startDate.toLocaleDateString('fr-FR')} au ${endDate.toLocaleDateString('fr-FR')}`,
        };
        break;
      }
    }

    onChange(period);
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Calendar className="h-4 w-4 text-primary-500" />
        <Select
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as PeriodType)}
          className="w-32"
        >
          {Object.entries(PERIOD_TYPE_LABELS).map(([key, label]) => (
            <SelectOption key={key} value={key}>{label}</SelectOption>
          ))}
        </Select>

        {periodType === 'month' && (
          <>
            <Select
              value={selectedMonth.toString()}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-32"
            >
              {MONTHS.map((month, i) => (
                <SelectOption key={i} value={i.toString()}>{month}</SelectOption>
              ))}
            </Select>
            <Select
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-24"
            >
              {years.map((year) => (
                <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
              ))}
            </Select>
          </>
        )}

        {periodType === 'week' && (
          <>
            <Select
              value={selectedWeek.toString()}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="w-24"
            >
              {weeks.map((week) => (
                <SelectOption key={week} value={week.toString()}>S{week}</SelectOption>
              ))}
            </Select>
            <Select
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-24"
            >
              {years.map((year) => (
                <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
              ))}
            </Select>
          </>
        )}

        {periodType === 'quarter' && (
          <>
            <Select
              value={selectedQuarter.toString()}
              onChange={(e) => setSelectedQuarter(Number(e.target.value))}
              className="w-20"
            >
              {QUARTERS.map((q, i) => (
                <SelectOption key={i} value={i.toString()}>{q}</SelectOption>
              ))}
            </Select>
            <Select
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-24"
            >
              {years.map((year) => (
                <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
              ))}
            </Select>
          </>
        )}

        {periodType === 'semester' && (
          <>
            <Select
              value={selectedSemester.toString()}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-20"
            >
              {SEMESTERS.map((s, i) => (
                <SelectOption key={i} value={i.toString()}>{s}</SelectOption>
              ))}
            </Select>
            <Select
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-24"
            >
              {years.map((year) => (
                <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
              ))}
            </Select>
          </>
        )}

        {periodType === 'year' && (
          <Select
            value={selectedYear.toString()}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-24"
          >
            {years.map((year) => (
              <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
            ))}
          </Select>
        )}

        {periodType === 'custom' && (
          <>
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="w-36"
            />
            <span className="text-primary-500">→</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="w-36"
            />
          </>
        )}

        <Button size="sm" onClick={handleApply}>
          Appliquer
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-primary-50 rounded-lg border border-primary-200', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary-600" />
        <h4 className="font-semibold text-primary-900">Période du rapport</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Type de période */}
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            Type de période
          </label>
          <Select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            className="w-full"
          >
            {Object.entries(PERIOD_TYPE_LABELS).map(([key, label]) => (
              <SelectOption key={key} value={key}>{label}</SelectOption>
            ))}
          </Select>
        </div>

        {/* Sélecteurs selon le type */}
        {periodType === 'week' && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Semaine
              </label>
              <Select
                value={selectedWeek.toString()}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="w-full"
              >
                {weeks.map((week) => (
                  <SelectOption key={week} value={week.toString()}>
                    Semaine {week}
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Année
              </label>
              <Select
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full"
              >
                {years.map((year) => (
                  <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
                ))}
              </Select>
            </div>
          </>
        )}

        {periodType === 'month' && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Mois
              </label>
              <Select
                value={selectedMonth.toString()}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full"
              >
                {MONTHS.map((month, i) => (
                  <SelectOption key={i} value={i.toString()}>{month}</SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Année
              </label>
              <Select
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full"
              >
                {years.map((year) => (
                  <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
                ))}
              </Select>
            </div>
          </>
        )}

        {periodType === 'quarter' && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Trimestre
              </label>
              <Select
                value={selectedQuarter.toString()}
                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                className="w-full"
              >
                {QUARTERS.map((q, i) => (
                  <SelectOption key={i} value={i.toString()}>
                    {q} ({MONTHS[i * 3]} - {MONTHS[i * 3 + 2]})
                  </SelectOption>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Année
              </label>
              <Select
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full"
              >
                {years.map((year) => (
                  <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
                ))}
              </Select>
            </div>
          </>
        )}

        {periodType === 'semester' && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Semestre
              </label>
              <Select
                value={selectedSemester.toString()}
                onChange={(e) => setSelectedSemester(Number(e.target.value))}
                className="w-full"
              >
                <SelectOption value="0">S1 (Janvier - Juin)</SelectOption>
                <SelectOption value="1">S2 (Juillet - Décembre)</SelectOption>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Année
              </label>
              <Select
                value={selectedYear.toString()}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full"
              >
                {years.map((year) => (
                  <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
                ))}
              </Select>
            </div>
          </>
        )}

        {periodType === 'year' && (
          <div>
            <label className="block text-sm font-medium text-primary-700 mb-1">
              Année
            </label>
            <Select
              value={selectedYear.toString()}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full"
            >
              {years.map((year) => (
                <SelectOption key={year} value={year.toString()}>{year}</SelectOption>
              ))}
            </Select>
          </div>
        )}

        {periodType === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Date de début
              </label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                Date de fin
              </label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Bouton appliquer */}
        <div className="flex items-end">
          <Button onClick={handleApply} className="w-full">
            Appliquer
          </Button>
        </div>
      </div>

      {/* Affichage de la période sélectionnée */}
      {value && (
        <div className="mt-4 pt-4 border-t border-primary-200">
          <p className="text-sm text-primary-600">
            <span className="font-medium">Période sélectionnée :</span>{' '}
            <span className="text-primary-900 font-semibold">{value.displayText}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDates(year: number, week: number): { start: string; end: string } {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);

  const startDate = new Date(startOfWeek1);
  startDate.setDate(startOfWeek1.getDate() + (week - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

export default ReportPeriodSelector;
