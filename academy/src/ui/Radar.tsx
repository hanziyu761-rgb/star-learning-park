import { DIMENSIONS, LEVEL_NAMES } from '../curriculum/types';
import type { AbilityResult } from '../learning/abilities';

// Five-axis radar of growth levels (0–4). Pure SVG, no chart library.
export function Radar({ results }: { results: AbilityResult[] }) {
  const size = 280, c = size / 2, r = 96;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / DIMENSIONS.length;
  const pt = (i: number, v: number) => [c + Math.cos(angle(i)) * r * v, c + Math.sin(angle(i)) * r * v];
  const levels = DIMENSIONS.map((d) => results.find((x) => x.dimension === d.id)?.level ?? 0);
  const poly = levels.map((lv, i) => pt(i, Math.max(lv, 0.08) / 4).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="radar" role="img" aria-label={'能力雷达图：' + DIMENSIONS.map((d, i) => `${d.name}${LEVEL_NAMES[levels[i]]}`).join('，')}>
      {[1, 2, 3, 4].map((ring) => (
        <polygon key={ring} points={DIMENSIONS.map((_, i) => pt(i, ring / 4).join(',')).join(' ')} className="radar-ring" />
      ))}
      {DIMENSIONS.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radar-axis" />; })}
      <polygon points={poly} className="radar-area" />
      {DIMENSIONS.map((d, i) => {
        const [x, y] = pt(i, 1.24);
        return <text key={d.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="radar-label">{d.name.replace('能力', '')}</text>;
      })}
    </svg>
  );
}
