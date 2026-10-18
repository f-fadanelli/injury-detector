/**
 * Conversão frase <-> número para os campos que a V4 espera em escala
 * numérica mas que, no front, são apresentados como frases amigáveis.
 *
 * A rede foi treinada com escalas específicas (Opção A — V4 intacta):
 *   stress:               0 .. 95   (tipo Garmin)
 *   body_battery_morning: 47 .. 100  -> "Percepção de Prontidão (manhã)"
 *   body_battery_evening: 5 .. 60    -> "Percepção de Prontidão (noite)"
 *
 * O banco/rede recebem SEMPRE o número. As frases existem só no front.
 */

export interface ScaleOption {
  label: string;
  value: number;
}

/** Percepção de prontidão ao acordar (mapeia body_battery_morning). */
export const READINESS_MORNING_OPTIONS: ScaleOption[] = [
  { label: 'Totalmente recuperado, pronto pra tudo', value: 95 },
  { label: 'Bem descansado', value: 82 },
  { label: 'Ok, mas não 100%', value: 68 },
  { label: 'Ainda cansado', value: 55 },
];

/** Percepção de prontidão ao fim do dia (mapeia body_battery_evening). */
export const READINESS_EVENING_OPTIONS: ScaleOption[] = [
  { label: 'Sobrou energia', value: 55 },
  { label: 'Cansaço normal do dia', value: 30 },
  { label: 'Bem esgotado', value: 15 },
  { label: 'Zerado', value: 8 },
];

/** Nível de estresse do dia (mapeia stress 0-95). */
export const STRESS_OPTIONS: ScaleOption[] = [
  { label: 'Tranquilo, dia leve', value: 10 },
  { label: 'Estresse normal', value: 28 },
  { label: 'Dia puxado', value: 50 },
  { label: 'Muito estressado', value: 75 },
];

/** Dado um valor numérico, acha a opção de frase mais próxima (para exibir). */
export function closestOption(
  options: ScaleOption[],
  value: number | null | undefined
): ScaleOption | null {
  if (value === null || value === undefined) return null;
  return options.reduce((best, opt) =>
    Math.abs(opt.value - value) < Math.abs(best.value - value) ? opt : best
  );
}


/** Converte pace "mm:ss" (string) para minutos decimais (número) — ex.: "5:30" -> 5.5. */
export function paceToDecimal(pace: string): number {
  const m = pace.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) + Number(m[2]) / 60;
}

/** Converte minutos decimais para "mm:ss" — ex.: 5.5 -> "5:30". */
export function decimalToPace(dec: number | null | undefined): string {
  if (dec === null || dec === undefined || isNaN(dec)) return '';
  const min = Math.floor(dec);
  const sec = Math.round((dec - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}
