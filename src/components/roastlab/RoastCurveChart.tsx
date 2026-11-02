import React, { useState } from 'react';
import { RoastLog, RoastCurvePoint } from '../../types/erp';

interface RoastCurveChartProps {
  roast: RoastLog;
  height?: number;
}

export const RoastCurveChart: React.FC<RoastCurveChartProps> = ({ roast, height = 240 }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Generate realistic thermodynamic curve points if not already provided
  const points: RoastCurvePoint[] = roast.curveData || generateSampleCurve(roast);

  const maxTime = roast.totalTimeSec || 645;
  const maxTemp = 230;
  const minTemp = 60;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const chartWidth = 600;
  const chartHeight = height;
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const getX = (timeSec: number) => padding.left + (timeSec / maxTime) * innerWidth;
  const getY = (tempC: number) =>
    padding.top + innerHeight - ((tempC - minTemp) / (maxTemp - minTemp)) * innerHeight;

  // Build SVG path for Bean Temp (BT)
  const btPath = points.reduce((path, pt, idx) => {
    const x = getX(pt.timeSec);
    const y = getY(pt.beanTempC);
    return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  // Build SVG path for Environmental Temp (ET)
  const etPath = points.reduce((path, pt, idx) => {
    const x = getX(pt.timeSec);
    const y = getY(pt.envTempC);
    return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
  }, '');

  // Phase Boundaries
  const tpX = getX(roast.turningPointTimeSec);
  const dryEndX = getX(roast.dryEndTimeSec);
  const fcX = getX(roast.firstCrackTimeSec);
  const dropX = getX(roast.totalTimeSec);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="relative w-full rounded-xl border border-zinc-200 bg-zinc-950 p-4 text-zinc-100 shadow-sm">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>Bean Temp (BT)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>Environmental Temp (ET)</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <span className="text-zinc-400">
            DTR:{' '}
            <strong className="text-emerald-400 font-mono">
              {roast.dtrPercent ? `${roast.dtrPercent.toFixed(1)}%` : '19.2%'}
            </strong>
          </span>
          <span className="text-zinc-400">
            Penyusutan:{' '}
            <strong className="text-amber-400 font-mono">
              {roast.weightLossPercent ? `${roast.weightLossPercent.toFixed(1)}%` : '13.5%'}
            </strong>
          </span>
          <span className="text-zinc-400">
            Drop Temp: <strong className="text-zinc-200 font-mono">{roast.dropTempC}°C</strong>
          </span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full select-none"
          style={{ minWidth: '480px' }}
        >
          {/* Phase Background Shading */}
          {/* Drying Phase */}
          <rect
            x={padding.left}
            y={padding.top}
            width={dryEndX - padding.left}
            height={innerHeight}
            fill="#eab308"
            fillOpacity="0.05"
          />
          {/* Maillard Phase */}
          <rect
            x={dryEndX}
            y={padding.top}
            width={fcX - dryEndX}
            height={innerHeight}
            fill="#f97316"
            fillOpacity="0.06"
          />
          {/* Development Phase */}
          <rect
            x={fcX}
            y={padding.top}
            width={dropX - fcX}
            height={innerHeight}
            fill="#ef4444"
            fillOpacity="0.08"
          />

          {/* Grid lines (horizontal temp) */}
          {[80, 120, 160, 200].map((t) => (
            <g key={t}>
              <line
                x1={padding.left}
                y1={getY(t)}
                x2={chartWidth - padding.right}
                y2={getY(t)}
                stroke="#3f3f46"
                strokeDasharray="3 3"
                strokeWidth="0.8"
              />
              <text
                x={padding.left - 6}
                y={getY(t) + 3}
                textAnchor="end"
                className="fill-zinc-500 text-[10px] font-mono"
              >
                {t}°C
              </text>
            </g>
          ))}

          {/* Vertical Phase Markers */}
          {/* Turning Point */}
          <line
            x1={tpX}
            y1={padding.top}
            x2={tpX}
            y2={padding.top + innerHeight}
            stroke="#60a5fa"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <text x={tpX} y={padding.top + 10} textAnchor="middle" className="fill-blue-400 text-[9px] font-mono">
            TP {roast.turningPointTempC}°C
          </text>

          {/* Dry End */}
          <line
            x1={dryEndX}
            y1={padding.top}
            x2={dryEndX}
            y2={padding.top + innerHeight}
            stroke="#facc15"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <text x={dryEndX} y={padding.top + 22} textAnchor="middle" className="fill-yellow-400 text-[9px] font-mono">
            Yellow/Dry End ({formatSeconds(roast.dryEndTimeSec)})
          </text>

          {/* First Crack */}
          <line
            x1={fcX}
            y1={padding.top}
            x2={fcX}
            y2={padding.top + innerHeight}
            stroke="#f97316"
            strokeDasharray="2 2"
            strokeWidth="1"
          />
          <text x={fcX} y={padding.top + 10} textAnchor="middle" className="fill-orange-400 text-[9px] font-mono">
            FC Start ({formatSeconds(roast.firstCrackTimeSec)})
          </text>

          {/* Drop Point */}
          <line
            x1={dropX}
            y1={padding.top}
            x2={dropX}
            y2={padding.top + innerHeight}
            stroke="#ef4444"
            strokeWidth="1.2"
          />
          <text x={dropX} y={padding.top + 22} textAnchor="end" className="fill-red-400 text-[9px] font-mono">
            DROP ({formatSeconds(roast.totalTimeSec)})
          </text>

          {/* Environmental Temp Curve (Red) */}
          <path d={etPath} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeOpacity="0.8" />

          {/* Bean Temp Curve (Amber) */}
          <path d={btPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />

          {/* Interactive Hover Circles */}
          {points.map((pt, idx) => {
            const cx = getX(pt.timeSec);
            const cy = getY(pt.beanTempC);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover target */}
                <circle cx={cx} cy={cy} r="8" fill="transparent" />
                {isHovered && (
                  <>
                    <circle cx={cx} cy={cy} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                    <line
                      x1={cx}
                      y1={padding.top}
                      x2={cx}
                      y2={padding.top + innerHeight}
                      stroke="#ffffff"
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* X Axis Time Labels */}
          {[0, 120, 240, 360, 480, 600].map((t) => (
            <text
              key={t}
              x={getX(t)}
              y={chartHeight - 10}
              textAnchor="middle"
              className="fill-zinc-500 text-[10px] font-mono"
            >
              {formatSeconds(t)}
            </text>
          ))}
        </svg>
      </div>

      {/* Tooltip Card */}
      {hoveredPoint && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-900 px-3 py-1.5 text-xs border border-zinc-800">
          <span className="text-zinc-400">
            Waktu:{' '}
            <strong className="text-zinc-200 font-mono">
              {formatSeconds(hoveredPoint.timeSec)}
            </strong>
          </span>
          <span className="text-amber-400">
            Bean Temp:{' '}
            <strong className="font-mono">{hoveredPoint.beanTempC}°C</strong>
          </span>
          <span className="text-red-400">
            Env Temp:{' '}
            <strong className="font-mono">{hoveredPoint.envTempC}°C</strong>
          </span>
          <span className="text-blue-400">
            RoR:{' '}
            <strong className="font-mono">{hoveredPoint.rateOfRise} °C/min</strong>
          </span>
          {hoveredPoint.event && (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
              {hoveredPoint.event}
            </span>
          )}
        </div>
      )}

      {/* Phases Legend Bar */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-medium border-t border-zinc-800/80 pt-2">
        <div className="rounded bg-yellow-500/10 py-1 text-yellow-400 border border-yellow-500/20">
          Drying Phase (0 - {formatSeconds(roast.dryEndTimeSec)})
        </div>
        <div className="rounded bg-orange-500/10 py-1 text-orange-400 border border-orange-500/20">
          Maillard Phase ({formatSeconds(roast.dryEndTimeSec)} -{' '}
          {formatSeconds(roast.firstCrackTimeSec)})
        </div>
        <div className="rounded bg-red-500/10 py-1 text-red-400 border border-red-500/20">
          Development (DTR {roast.dtrPercent ? `${roast.dtrPercent.toFixed(1)}%` : '19.2%'})
        </div>
      </div>
    </div>
  );
};

// Helper: Synthesize realistic thermodynamic curve data if not supplied in database
function generateSampleCurve(roast: RoastLog): RoastCurvePoint[] {
  const points: RoastCurvePoint[] = [];
  const total = roast.totalTimeSec || 645;
  const tpTime = roast.turningPointTimeSec || 85;
  const dryTime = roast.dryEndTimeSec || 295;
  const fcTime = roast.firstCrackTimeSec || 520;

  for (let t = 0; t <= total; t += 30) {
    let bt: number;
    let et: number;
    let ror: number;
    let event: string | undefined;

    if (t === 0) {
      bt = roast.chargeTempC;
      et = roast.chargeTempC + 20;
      ror = 0;
      event = 'Charge';
    } else if (t <= tpTime) {
      const prog = t / tpTime;
      bt = Math.round(roast.chargeTempC - (roast.chargeTempC - roast.turningPointTempC) * Math.sin(prog * (Math.PI / 2)));
      et = Math.round(roast.chargeTempC + 10 - 30 * prog);
      ror = -5;
      if (t >= tpTime - 15) event = 'Turning Point';
    } else if (t <= dryTime) {
      const prog = (t - tpTime) / (dryTime - tpTime);
      bt = Math.round(roast.turningPointTempC + (roast.dryEndTempC - roast.turningPointTempC) * prog);
      et = Math.round(180 + 20 * prog);
      ror = Math.round((14 - 4 * prog) * 10) / 10;
      if (t >= dryTime - 15) event = 'Yellowing / Dry End';
    } else if (t <= fcTime) {
      const prog = (t - dryTime) / (fcTime - dryTime);
      bt = Math.round(roast.dryEndTempC + (roast.firstCrackTempC - roast.dryEndTempC) * Math.pow(prog, 0.9));
      et = Math.round(200 + 15 * prog);
      ror = Math.round((10 - 3 * prog) * 10) / 10;
      if (t >= fcTime - 15) event = 'First Crack Start';
    } else {
      const prog = (t - fcTime) / (total - fcTime);
      bt = Math.round(roast.firstCrackTempC + (roast.dropTempC - roast.firstCrackTempC) * Math.pow(prog, 0.8));
      et = Math.round(215 + 5 * prog);
      ror = Math.round((7 - 2 * prog) * 10) / 10;
      if (t >= total - 15) event = 'Drop';
    }

    points.push({
      timeSec: t,
      timeLabel: `${Math.floor(t / 60)}:${t % 60 < 10 ? '0' : ''}${t % 60}`,
      beanTempC: bt,
      envTempC: et,
      rateOfRise: ror,
      event
    });
  }

  return points;
}
