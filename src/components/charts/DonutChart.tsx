"use client";

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  title?: string;
}

export function DonutChart({ segments, size = 80, strokeWidth = 8, title }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div 
          className="rounded-full bg-divider"
          style={{ width: size, height: size }}
        />
        {title && <span className="text-xs text-text-muted">{title}</span>}
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            style={{ color: "#e0e0e0" }}
          />
          
          {/* Segments */}
          {segments.map((segment, index) => {
            if (segment.value === 0) return null;
            
            const percentage = segment.value / total;
            const dashLength = percentage * circumference;
            const dashOffset = -currentOffset;
            currentOffset += dashLength;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-text-primary">{total}</span>
        </div>
      </div>
      
      {title && <span className="text-xs font-medium text-text-secondary">{title}</span>}
    </div>
  );
}

interface DonutLegendProps {
  segments: DonutSegment[];
}

export function DonutLegend({ segments }: DonutLegendProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {segments.map((segment, index) => (
        <div key={index} className="flex items-center gap-1.5 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: segment.color }}
          />
          <span className="text-text-secondary">{segment.label}</span>
          <span className="text-text-muted">
            ({segment.value}{total > 0 ? ` · ${Math.round((segment.value / total) * 100)}%` : ""})
          </span>
        </div>
      ))}
    </div>
  );
}