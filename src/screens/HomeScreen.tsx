import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getLatestTraining,
  getLatestDaily,
  getDashboard,
} from '../services/dataService';
import { Header } from '../components/Header';
import Footer from '../components/Footer';
import type { TrainingRecord, DailyRecord, InjuryPrediction } from '../types';
import './HomeScreen.css';

function riskStatus(latest: InjuryPrediction | null) {
  if (latest && latest.risk_flag === 1) {
    return {
      hasRisk: true,
      title: '⚠️ Risco de lesão detectado',
      message: `Probabilidade de ${(latest.risk_probability * 100).toFixed(
        0
      )}% na análise de ${latest.prediction_date.slice(0, 10)}. Revise sua carga e recuperação.`,
    };
  }
  if (latest) {
    return {
      hasRisk: false,
      title: '✅ Nenhum risco de lesão detectado',
      message: `Probabilidade de ${(latest.risk_probability * 100).toFixed(
        0
      )}% na análise de ${latest.prediction_date.slice(0, 10)}.`,
    };
  }
  return {
    hasRisk: false,
    title: 'Sem análise ainda',
    message: 'Ainda não há uma predição calculada para o seu histórico.',
  };
}

export default function HomeScreen() {
  const { athleteName, athleteId } = useAuth();
  const navigate = useNavigate();

  const [lastTraining, setLastTraining] = useState<TrainingRecord | null>(null);
  const [lastDaily, setLastDaily] = useState<DailyRecord | null>(null);
  const [latest, setLatest] = useState<InjuryPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!athleteId) return;
    let active = true;
    (async () => {
      try {
        const [training, daily, dashboard] = await Promise.all([
          getLatestTraining(athleteId),
          getLatestDaily(athleteId),
          getDashboard(athleteId),
        ]);
        if (!active) return;
        setLastTraining(training);
        setLastDaily(daily);
        setLatest(dashboard.latest);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [athleteId]);

  const status = riskStatus(latest);

  return (
    <div className="home-screen">
      <Header />

      <main className="home-screen__content">
        <h1 className="home-screen__welcome">Bem vindo, {athleteName}!</h1>

        {loading ? (
          <p className="home-screen__card-text">Carregando...</p>
        ) : (
          <div className="home-screen__cards">
            {/* Último treino */}
            <div className="home-screen__card">
              <h2 className="home-screen__card-title">Último treino</h2>
              {lastTraining ? (
                <>
                  <p className="home-screen__card-text">Tipo: {lastTraining.workout_type}</p>
                  <p className="home-screen__card-text">
                    Distância: {lastTraining.distance_km} km
                  </p>
                </>
              ) : (
                <p className="home-screen__card-text home-screen__card--no-records">
                  Nenhum registro encontrado
                </p>
              )}
              {lastDaily ? (
                <p className="home-screen__card-text">
                  Último registro diário: {lastDaily.date}
                </p>
              ) : (
                <p className="home-screen__card-text home-screen__card--no-records">
                  Nenhum registro encontrado
                </p>
              )}
            </div>

            {/* Risco de lesão (da predição V4) */}
            <div
              className={`home-screen__card ${
                status.hasRisk
                  ? 'home-screen__risk-card--warning'
                  : 'home-screen__risk-card--clear'
              }`}
            >
              <h2 className="home-screen__card-title">{status.title}</h2>
              <p className="home-screen__card-text">{status.message}</p>
            </div>

            {/* Navegação: diárias */}
            <div
              className="home-screen__nav-card"
              onClick={() => navigate('/daily')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/daily');
              }}
            >
              <span className="home-screen__nav-card-label">Informações diárias</span>
              <svg className="home-screen__nav-card-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </div>

            {/* Navegação: treino */}
            <div
              className="home-screen__nav-card"
              onClick={() => navigate('/training')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/training');
              }}
            >
              <span className="home-screen__nav-card-label">Informações de treino</span>
              <svg className="home-screen__nav-card-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </div>

            {/* Navegação: gráficos de acompanhamento */}
            <div
              className="home-screen__nav-card"
              onClick={() => navigate('/charts')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') navigate('/charts');
              }}
            >
              <span className="home-screen__nav-card-label">Gráficos de acompanhamento</span>
              <svg className="home-screen__nav-card-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
