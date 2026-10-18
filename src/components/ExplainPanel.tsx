import { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { getExplain } from '../services/dataService';
import type { ExplainData } from '../types';
import './ExplainPanel.css';

interface ExplainPanelProps {
  athleteId: string;
  days: number;
  threshold: number; // limiar de alerta em %
}

const COLORS = ['#2563eb', '#16a34a', '#db2777', '#f59e0b', '#7c3aed', '#0891b2'];
const MAX_SELECTED = 4;

export function ExplainPanel({ athleteId, days, threshold }: ExplainPanelProps) {
  const [data, setData] = useState<ExplainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>('');

  useEffect(() => {
    if (!athleteId) return;
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const d = await getExplain(athleteId, {
          days,
          features: selected,
          date: selectedDay || undefined,
        });
        if (!active) return;
        setData(d);
        // Sem pré-seleção: entra vazio e a seleção do usuário é mantida ao
        // trocar o período.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [athleteId, days, selected, selectedDay]);

  const labelByFeature = useMemo(() => {
    const m = new Map<string, string>();
    data?.ranking.forEach((r) => m.set(r.feature, r.label));
    return m;
  }, [data]);

  function toggleFeature(feature: string) {
    setSelected((prev) => {
      if (prev.includes(feature)) return prev.filter((f) => f !== feature);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, feature];
    });
  }

  // Gráfico combinado: risco (%) + valores das features selecionadas.
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.series.map((p) => {
      const row: Record<string, number | string> = {
        date: p.date,
        risk: p.risk,
      };
      for (const f of selected) {
        if (p.features[f] !== undefined) row[f] = p.features[f];
      }
      return row;
    });
  }, [data, selected]);

  if (loading && !data) {
    return <p className="explain-empty">Carregando...</p>;
  }
  if (!data || data.ranking.length === 0) {
    return (
      <p className="explain-empty">
        Sem dados de explicabilidade ainda. As predições com SHAP são geradas
        pela rotina de análise.
      </p>
    );
  }

  return (
    <div className="explain-panel">
      {/* Gráfico combinado: risco + atributos selecionados */}
      <div className="charts-card">
        <h2 className="charts-card-title">
          Risco de lesão (%) e atributos selecionados
        </h2>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
            <YAxis
              yAxisId="risk"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              label={{ value: 'Risco %', angle: -90, position: 'insideLeft', fontSize: 12 }}
            />
            <YAxis
              yAxisId="feat"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'Atributo', angle: 90, position: 'insideRight', fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            {/* Features selecionadas (eixo direito) */}
            {selected.map((f, i) => (
              <Line
                key={f}
                yAxisId="feat"
                type="monotone"
                dataKey={f}
                name={labelByFeature.get(f) || f}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.8}
                dot={false}
                connectNulls
              />
            ))}
            {/* Risco de lesão (eixo esquerdo), sempre em destaque */}
            <Line
              yAxisId="risk"
              type="monotone"
              dataKey="risk"
              name="Risco de lesão (%)"
              stroke="#dc2626"
              strokeWidth={2.5}
              dot={false}
            />
            <ReferenceLine
              yAxisId="risk"
              y={threshold}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: `Alerta ${threshold}%`, fontSize: 11, fill: '#b45309' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Seletor de atributos (ordenado por contribuição SHAP) */}
      <div className="charts-card">
        <h2 className="charts-card-title">
          O que mais influencia o risco
        </h2>
        <p className="explain-hint">
          Selecione até {MAX_SELECTED} atributos para adicionar as linhas no gráfico acima.
        </p>
        <div className="explain-feature-list">
          {data.ranking.slice(0, 20).map((r) => {
            const active = selected.includes(r.feature);
            const idx = selected.indexOf(r.feature);
            return (
              <button
                key={r.feature}
                className={`explain-feature-chip ${active ? 'active' : ''}`}
                onClick={() => toggleFeature(r.feature)}
                title={`Contribuição média: ${r.mean_abs_shap}`}
              >
                <span className="explain-feature-name">
                  {active && (
                    <span
                      className="explain-feature-dot"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                  )}
                  {r.label}
                </span>
                <span className="explain-feature-bar">
                  <span
                    className="explain-feature-bar-fill"
                    style={{
                      width: `${Math.min(
                        (r.mean_abs_shap / data.ranking[0].mean_abs_shap) * 100,
                        100
                      )}%`,
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Decomposição SHAP de um dia (intacto) */}
      <div className="charts-card">
        <h2 className="charts-card-title">Por que o risco neste dia?</h2>
        <div className="explain-day-picker">
          <label htmlFor="explain-day">Escolha uma data:</label>
          <select
            id="explain-day"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          >
            <option value="">Selecione</option>
            {data.series.map((p) => (
              <option key={p.date} value={p.date}>
                {p.date} — risco {p.risk}%
              </option>
            ))}
          </select>
        </div>

        {data.day ? (
          <>
            <p className="explain-day-summary">
              Em <strong>{data.day.date}</strong>, o risco estimado foi{' '}
              <strong>{data.day.risk}%</strong>. As barras à direita
              aumentaram o risco e à esquerda reduziram.
            </p>
            <ResponsiveContainer width="100%" height={Math.max(data.day.shap.length * 26, 200)}>
              <BarChart
                data={[...data.day.shap].sort((a, b) => a.contribution - b.contribution)}
                layout="vertical"
                margin={{ top: 10, right: 30, bottom: 10, left: 160 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={160} />
                <Tooltip />
                <Bar dataKey="contribution" name="Contribuição">
                  {data.day.shap.map((s, i) => (
                    <Cell key={i} fill={s.contribution >= 0 ? '#dc2626' : '#16a34a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </>
        ) : (
          <p className="explain-hint">
            Selecione uma data acima para ver a decomposição da predição.
          </p>
        )}
      </div>
    </div>
  );
}
