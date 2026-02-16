import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  BarChart2,
  Table,
  Plus,
  Database,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectOption } from '@/components/ui/select';
import {
  CHART_TEMPLATES,
  TABLE_TEMPLATES,
  searchCharts,
  searchTables,
  CHART_COLORS,
} from '@/data/dataLibrary';
import {
  createChartWithLiveData,
  createTableWithLiveData,
} from '@/services/dataLibraryService';
import type {
  ChartTemplate,
  TableTemplate,
  ChartCategory,
  TableCategory,
  ReportType,
} from '@/types/reportStudio';
import {
  CHART_CATEGORY_LABELS,
  CHART_CATEGORY_COLORS,
  TABLE_CATEGORY_LABELS,
  TABLE_CATEGORY_COLORS,
  CHART_CATEGORIES,
  TABLE_CATEGORIES,
} from '@/types/reportStudio';

// Simple chart preview
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { logger } from '@/lib/logger';

interface DataLibraryModalProps {
  isOpen: boolean;
  reportType?: ReportType;
  onClose: () => void;
  onInsertChart: (chart: ChartTemplate) => void;
  onInsertTable: (table: TableTemplate) => void;
}

function ChartPreview({ chart }: { chart: ChartTemplate }) {
  const data = chart.data.labels.map((label, i) => ({
    name: label,
    value: chart.data.datasets[0]?.data[i] || 0,
    value2: chart.data.datasets[1]?.data[i],
  }));

  const colors = chart.config.colors || CHART_COLORS;

  switch (chart.chartType) {
    case 'bar':
    case 'horizontal_bar':
    case 'stacked_bar':
      return (
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={data} layout={chart.chartType === 'horizontal_bar' ? 'vertical' : 'horizontal'}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} hide />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="value" fill={colors[0]} radius={[2, 2, 0, 0]} />
            {chart.data.datasets.length > 1 && (
              <Bar dataKey="value2" fill={colors[1]} radius={[2, 2, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
    case 'area':
      return (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} hide />
            <YAxis hide />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={colors[0]} strokeWidth={2} dot={false} />
            {chart.data.datasets.length > 1 && (
              <Line type="monotone" dataKey="value2" stroke={colors[1]} strokeWidth={2} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      );
    case 'pie':
    case 'donut': {
      const pieData = data.map((d, i) => ({ ...d, fill: colors[i % colors.length] }));
      return (
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              cx="50%"
              cy="50%"
              innerRadius={chart.chartType === 'donut' ? 25 : 0}
              outerRadius={45}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    default:
      return (
        <div className="h-[120px] flex items-center justify-center text-gray-400">
          <BarChart2 className="h-12 w-12" />
        </div>
      );
  }
}

function TablePreview({ table }: { table: TableTemplate }) {
  const displayRows = table.rows.slice(0, 3);
  const displayHeaders = table.headers.slice(0, 4);

  return (
    <div className="overflow-hidden rounded border text-xs">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            {displayHeaders.map((header) => (
              <th key={header.key} className="px-2 py-1 text-left font-medium truncate">
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, i) => (
            <tr key={i} className="border-t">
              {displayHeaders.map((header) => (
                <td key={header.key} className="px-2 py-1 truncate max-w-[80px]">
                  {String(row[header.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.rows.length > 3 && (
        <div className="px-2 py-1 text-center text-gray-400 bg-gray-50 border-t">
          +{table.rows.length - 3} lignes
        </div>
      )}
    </div>
  );
}

export function DataLibraryModal({
  isOpen,
  reportType,
  onClose,
  onInsertChart,
  onInsertTable,
}: DataLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'charts' | 'tables'>('charts');
  const [searchQuery, setSearchQuery] = useState('');
  const [chartCategory, setChartCategory] = useState<ChartCategory | 'all'>('projet');
  const [tableCategory, setTableCategory] = useState<TableCategory | 'all'>('projet');
  const [, setPreviewItem] = useState<ChartTemplate | TableTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredCharts = useMemo(() => {
    let charts = searchQuery ? searchCharts(searchQuery) : CHART_TEMPLATES;

    if (chartCategory !== 'all') {
      charts = charts.filter((c) => c.category === chartCategory);
    }

    if (reportType) {
      charts = charts.filter((c) => c.compatibleReportTypes.includes(reportType));
    }

    return charts;
  }, [searchQuery, chartCategory, reportType]);

  const filteredTables = useMemo(() => {
    let tables = searchQuery ? searchTables(searchQuery) : TABLE_TEMPLATES;

    if (tableCategory !== 'all') {
      tables = tables.filter((t) => t.category === tableCategory);
    }

    if (reportType) {
      tables = tables.filter((t) => t.compatibleReportTypes.includes(reportType));
    }

    return tables;
  }, [searchQuery, tableCategory, reportType]);

  const handleInsertChart = useCallback(async (chart: ChartTemplate) => {
    setIsLoading(true);
    try {
      // Fetch live data if available
      const chartWithData = await createChartWithLiveData(chart);
      onInsertChart(chartWithData);
      onClose();
    } catch (error) {
      logger.error('Error fetching chart data:', error);
      // Fallback to static data
      onInsertChart(chart);
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [onInsertChart, onClose]);

  const handleInsertTable = useCallback(async (table: TableTemplate) => {
    setIsLoading(true);
    try {
      // Fetch live data if available
      const tableWithData = await createTableWithLiveData(table);
      onInsertTable(tableWithData);
      onClose();
    } catch (error) {
      logger.error('Error fetching table data:', error);
      // Fallback to static data
      onInsertTable(table);
      onClose();
    } finally {
      setIsLoading(false);
    }
  }, [onInsertTable, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Catalogue de données
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'charts' | 'tables')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4 pb-4 border-b">
            <TabsList>
              <TabsTrigger value="charts" className="gap-2">
                <BarChart2 className="h-4 w-4" />
                Graphiques
                <Badge variant="secondary">{filteredCharts.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="tables" className="gap-2">
                <Table className="h-4 w-4" />
                Tableaux
                <Badge variant="secondary">{filteredTables.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {activeTab === 'charts' && (
                <Select
                  value={chartCategory}
                  onChange={(e) => setChartCategory(e.target.value as ChartCategory | 'all')}
                  className="w-40"
                >
                  <SelectOption value="all">Toutes les catégories</SelectOption>
                  {CHART_CATEGORIES.map((cat) => (
                    <SelectOption key={cat} value={cat}>
                      {CHART_CATEGORY_LABELS[cat]}
                    </SelectOption>
                  ))}
                </Select>
              )}
              {activeTab === 'tables' && (
                <Select
                  value={tableCategory}
                  onChange={(e) => setTableCategory(e.target.value as TableCategory | 'all')}
                  className="w-40"
                >
                  <SelectOption value="all">Toutes les catégories</SelectOption>
                  {TABLE_CATEGORIES.map((cat) => (
                    <SelectOption key={cat} value={cat}>
                      {TABLE_CATEGORY_LABELS[cat]}
                    </SelectOption>
                  ))}
                </Select>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="pl-9 w-60"
                />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="charts" className="m-0">
              <div className="grid grid-cols-3 gap-4">
                {filteredCharts.map((chart) => {
                  const hasLiveData = chart.dataSource?.type === 'entity' &&
                    ['actions', 'jalons', 'risques', 'budget'].includes(chart.dataSource.entityType || '');
                  return (
                    <div
                      key={chart.id}
                      className={cn(
                        "group relative border rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer",
                        hasLiveData ? "border-green-200 hover:border-green-400" : "hover:border-blue-300"
                      )}
                      onClick={() => setPreviewItem(chart)}
                    >
                      {hasLiveData && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                            <Database className="h-3 w-3" />
                            Données réelles
                          </span>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 border-b">
                        <ChartPreview chart={chart} />
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                              {chart.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {chart.description}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${CHART_CATEGORY_COLORS[chart.category]}20`,
                              color: CHART_CATEGORY_COLORS[chart.category],
                            }}
                          >
                            {CHART_CATEGORY_LABELS[chart.category]}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertChart(chart);
                          }}
                          disabled={isLoading}
                          className="w-full mt-3 gap-1"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {hasLiveData ? 'Insérer (données live)' : 'Insérer'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filteredCharts.length === 0 && (
                  <div className="col-span-3 text-center py-12">
                    <BarChart2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun graphique trouvé</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tables" className="m-0">
              <div className="grid grid-cols-2 gap-4">
                {filteredTables.map((table) => {
                  const hasLiveData = table.dataSource?.type === 'entity' &&
                    ['actions', 'jalons', 'risques', 'budget'].includes(table.dataSource.entityType || '');
                  return (
                    <div
                      key={table.id}
                      className={cn(
                        "group relative border rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer",
                        hasLiveData ? "border-green-200 hover:border-green-400" : "hover:border-blue-300"
                      )}
                      onClick={() => setPreviewItem(table)}
                    >
                      {hasLiveData && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                            <Database className="h-3 w-3" />
                            Données réelles
                          </span>
                        </div>
                      )}
                      <div className="p-3 bg-gray-50 border-b">
                        <TablePreview table={table} />
                      </div>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                              {table.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                              {table.description}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${TABLE_CATEGORY_COLORS[table.category]}20`,
                              color: TABLE_CATEGORY_COLORS[table.category],
                            }}
                          >
                            {TABLE_CATEGORY_LABELS[table.category]}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertTable(table);
                          }}
                          disabled={isLoading}
                          className="w-full mt-3 gap-1"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {hasLiveData ? 'Insérer (données live)' : 'Insérer'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filteredTables.length === 0 && (
                  <div className="col-span-2 text-center py-12">
                    <Table className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun tableau trouvé</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
