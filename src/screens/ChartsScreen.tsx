import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import { ExplainPanel } from '../components/ExplainPanel';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getDashboard } from '../services/dataService';
import type { DashboardData } from '../types';
import './ChartsScreen.css';

export function ChartsScreen() {
  const navigate = useNavigate();
  const { athleteId } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<DashboardData | null>(null);
  // "initialLoading" vale só na primeira carga; trocar o período NÃO
  // desmonta o ExplainPanel (senão a seleção de features seria perdida).
  const [initialLoading, setInitialLoading] = useState(true);
  const [days, setDays] = useState(90);

  useEffect(() => {
    if (!athleteId) return;
    let active = true;
    (async () => {
      try {
        const d = await getDashboard(athleteId, days);
        if (active) setData(d);
      } catch {
        if (active) showToast('Erro ao carregar os gráficos.', 'error');
      } finally {
        if (active) setInitialLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [athleteId, days, showToast]);

  const threshold = data?.latest?.threshold_used
    ? Math.round(data.latest.threshold_used * 100)
    : 28;

  const hasData = !!data?.latest;

  return (
    <div className="charts-screen">
      <Header />

      <main className="charts-content">
        <div className="charts-header-row">
          <button className="charts-back-btn" onClick={() => navigate('/home')} aria-label="Voltar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="charts-title">Acompanhamento</h1>
          <select
            className="charts-range"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Período"
          >
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
            <option value={180}>Últimos 180 dias</option>
            <option value={365}>Último ano</option>
          </select>
        </div>

        {initialLoading ? (
          <p className="charts-empty">Carregando...</p>
        ) : !hasData ? (
          <p className="charts-empty">
            Ainda não há dados de risco calculados para exibir. As predições são
            geradas pela rotina diária de análise.
          </p>
        ) : (
          <>
            {data?.latest && (
              <div className="charts-card">
                <h2 className="charts-card-title">Última análise</h2>
                <p className="charts-latest">
                  Em <strong>{data.latest.prediction_date.slice(0, 10)}</strong>, o
                  risco estimado foi de{' '}
                  <strong>{Math.round(data.latest.risk_probability * 100)}%</strong>{' '}
                  {/* ({data.latest.risk_flag === 1 ? 'acima' : 'abaixo'} do limiar de
                  alerta de {threshold}%). */}
                  - {data.latest.risk_flag === 1 ? 'acima' : 'abaixo'} do nível de
                  alerta.
                </p>
              </div>
            )}

            {/* Gráfico combinado (risco + atributos) + SHAP, no painel de explicabilidade */}
            {athleteId && (
              <ExplainPanel athleteId={athleteId} days={days} threshold={threshold} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
