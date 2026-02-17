import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, Badge, Progress } from '@/components/ui';
import { useEVMIndicators } from '@/hooks';
import { formatCurrency } from '@/lib/utils';
import { interpretSPI, interpretCPI } from '@/lib/calculations';
import { SEUILS } from '@/data/constants';

export function EVMIndicators() {
  const evm = useEVMIndicators();

  const spiStatus = interpretSPI(evm.SPI);
  const cpiStatus = interpretCPI(evm.CPI);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ahead':
      case 'under_budget':
        return <Badge variant="success">En avance</Badge>;
      case 'on_track':
      case 'on_budget':
        return <Badge variant="info">Sur la cible</Badge>;
      default:
        return <Badge variant="error">En retard</Badge>;
    }
  };

  const getStatusIcon = (value: number) => {
    if (value > SEUILS.evm.bon + 0.05) return <TrendingUp className="h-4 w-4 text-success-500" />;
    if (value >= SEUILS.evm.attention + 0.05) return <Minus className="h-4 w-4 text-info-500" />;
    return <TrendingDown className="h-4 w-4 text-error-500" />;
  };

  return (
    <Card padding="md">
      <h3 className="text-lg font-semibold text-primary-900 mb-4">
        Indicateurs EVM
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {/* SPI - Schedule Performance Index */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-500">SPI (Schedule)</span>
            {getStatusIcon(evm.SPI)}
          </div>
          <p className="text-2xl font-bold text-primary-900">
            {evm.SPI.toFixed(2)}
          </p>
          <Progress
            value={Math.min(evm.SPI * 100, 150)}
            max={150}
            variant={evm.SPI >= SEUILS.evm.attention + 0.05 ? 'success' : 'error'}
            size="sm"
          />
          {getStatusBadge(spiStatus)}
        </div>

        {/* CPI - Cost Performance Index */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-500">CPI (Cost)</span>
            {getStatusIcon(evm.CPI)}
          </div>
          <p className="text-2xl font-bold text-primary-900">
            {evm.CPI.toFixed(2)}
          </p>
          <Progress
            value={Math.min(evm.CPI * 100, 150)}
            max={150}
            variant={evm.CPI >= SEUILS.evm.attention + 0.05 ? 'success' : 'error'}
            size="sm"
          />
          {getStatusBadge(cpiStatus)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
        <div className="text-center">
          <p className="text-xs text-primary-400">PV (Planned Value)</p>
          <p className="text-sm font-semibold">{formatCurrency(evm.PV)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-primary-400">EV (Earned Value)</p>
          <p className="text-sm font-semibold">{formatCurrency(evm.EV)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-primary-400">AC (Actual Cost)</p>
          <p className="text-sm font-semibold">{formatCurrency(evm.AC)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-xs text-primary-400">Schedule Variance (SV)</p>
          <p
            className={cn(
              'text-sm font-semibold',
              evm.SV >= 0 ? 'text-success-600' : 'text-error-600'
            )}
          >
            {evm.SV >= 0 ? '+' : ''}
            {formatCurrency(evm.SV)}
          </p>
        </div>
        <div>
          <p className="text-xs text-primary-400">Cost Variance (CV)</p>
          <p
            className={cn(
              'text-sm font-semibold',
              evm.CV >= 0 ? 'text-success-600' : 'text-error-600'
            )}
          >
            {evm.CV >= 0 ? '+' : ''}
            {formatCurrency(evm.CV)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-xs text-primary-400">EAC (Estimate at Completion)</p>
          <p className="text-sm font-semibold">{evm.EAC !== null ? formatCurrency(evm.EAC) : 'N/A'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-primary-400">ETC (Estimate to Complete)</p>
          <p className="text-sm font-semibold">{evm.ETC !== null ? formatCurrency(evm.ETC) : 'N/A'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-primary-400">VAC (Variance at Completion)</p>
          <p
            className={cn(
              'text-sm font-semibold',
              evm.VAC === null ? 'text-primary-400' : evm.VAC >= 0 ? 'text-success-600' : 'text-error-600'
            )}
          >
            {evm.VAC === null ? 'N/A' : `${evm.VAC >= 0 ? '+' : ''}${formatCurrency(evm.VAC)}`}
          </p>
        </div>
      </div>
    </Card>
  );
}
