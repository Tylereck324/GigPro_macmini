'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { formatCurrency } from '@/lib/utils/profitCalculations';
import { DAYS, TIME_SLOTS, HeatmapData, getMaxHourlyRate } from '@/lib/utils/trendsCalculations';
import { Card } from '../ui';

interface TrendsHeatmapProps {
  data: HeatmapData;
  isLoading?: boolean;
}

export function TrendsHeatmap({ data, isLoading }: TrendsHeatmapProps) {
  const maxRate = getMaxHourlyRate(data);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper to determine color intensity
  const getCellColor = (rate: number) => {
    if (rate === 0) return 'bg-surface border-border';
    
    // Calculate intensity (0 to 1)
    const intensity = maxRate > 0 ? rate / maxRate : 0;

    // Tailwind classes don't support dynamic opacity easily with arbitrary values
    // So we use inline styles for precise control over opacity/color mixing
    // Using the primary color (Blue/Teal) for the heatmap
    if (intensity < 0.25) return 'bg-primary/10 border-primary/20 text-textSecondary';
    if (intensity < 0.5) return 'bg-primary/30 border-primary/40 text-text';
    if (intensity < 0.75) return 'bg-primary/60 border-primary/70 text-white';
    return 'bg-primary border-primary text-white shadow-lg scale-105 z-10';
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surface rounded w-1/3"></div>
        <div className="grid grid-cols-8 gap-2">
          {[...Array(40)].map((_, i) => (
            <div key={i} className="h-16 bg-surface rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header Row (Days) */}
        <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 mb-2">
          <div className="text-xs font-semibold text-textSecondary flex items-end pb-2">
            Time / Day
          </div>
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm font-bold text-text">
              {day}
            </div>
          ))}
        </div>

        {/* Data Rows (Time Slots) */}
        <div className="space-y-2">
          {TIME_SLOTS.map((time) => (
            <div key={time} className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 h-16">
              {/* Row Label */}
              <div className="text-xs font-medium text-textSecondary flex items-center">
                {time}
              </div>

              {/* Data Cells */}
              {DAYS.map((day) => {
                const slot = data[day][time];
                const hasData = slot.count > 0;

                return (
                  <div
                    key={`${day}-${time}`}
                    className={clsx(
                      'rounded-lg border flex flex-col items-center justify-center p-1 transition-all duration-200 cursor-default group relative',
                      isMounted ? 'opacity-100' : 'opacity-0',
                      getCellColor(slot.hourlyRate)
                    )}
                  >
                    {hasData ? (
                      <>
                        <span className="text-sm font-bold">
                          {formatCurrency(slot.hourlyRate)}
                          <span className="text-[10px] font-normal opacity-80">/hr</span>
                        </span>
                        <span className="text-[10px] opacity-70">
                          {slot.count} {slot.count === 1 ? 'block' : 'blocks'}
                        </span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-surface text-text text-xs p-2 rounded shadow-xl border border-border opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20 transition-opacity">
                          {day} {time}<br/>
                          Avg: {formatCurrency(slot.hourlyRate)}/hr
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-textSecondary/30">-</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 flex items-center justify-end gap-4 text-xs text-textSecondary">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary/10 border border-primary/20"></div>
          <span>Low Earnings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary border border-primary"></div>
          <span>High Earnings</span>
        </div>
      </div>
    </Card>
  );
}
