'use client';

import { Card } from '@/components/ui';
import type { DailySchedule } from '@/types/simulator';

interface DailyScheduleGridProps {
  schedule: DailySchedule[];
}

export function DailyScheduleGrid({ schedule }: DailyScheduleGridProps) {
  return (
    <Card>
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-text">Recommended Schedule</h2>

        <div className="grid grid-cols-7 gap-2">
          {schedule.map((day) => (
            <div
              key={day.dayIndex}
              className="flex flex-col items-center p-3 bg-background rounded-lg border border-border"
            >
              {/* Day Name */}
              <div className="font-semibold text-text mb-2">{day.dayName}</div>

              {/* Blocks */}
              <div className="space-y-1 w-full">
                {day.blocks.length > 0 ? (
                  day.blocks.map((block, index) => (
                    <div
                      key={index}
                      className="text-center py-2 px-1 bg-primary/10 text-primary rounded text-sm font-medium"
                    >
                      {(block.blockLength / 60).toFixed(1)}h
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-textSecondary text-sm">-</div>
                )}
              </div>

              {/* Total Hours */}
              <div className="mt-2 pt-2 border-t border-border w-full text-center">
                <span className="text-xs text-textSecondary">
                  {day.totalHours.toFixed(1)}h
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
