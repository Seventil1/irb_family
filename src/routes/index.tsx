import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  SEGMENTS,
  LEADS,
  BUDGET,
  CPL,
  DELTAS,
  buildSeries,
  nf,
  nfRub,
  fmtPct,
  type SegmentKey,
} from "@/lib/pilot-data";
import { BrandBar } from "@/components/report/BrandBar";
import { ReportHeader } from "@/components/report/ReportHeader";
import { SectionHeader } from "@/components/report/SectionHeader";
import { KpiCard, DeltaValue } from "@/components/report/KpiCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Пилот IRB Family — итоги 1-й недели" },
      {
        name: "description",
        content:
          "Результаты первой недели пилота лидогенерации IRB Family: рост лидов в 2× быстрее контрольной группы, снижение CPL по МСК+СПб на 46,67%.",
      },
      { property: "og:title", content: "Пилот IRB Family — итоги 1-й недели" },
      {
        property: "og:description",
        content: "Интерактивный отчёт HR-Rocket: лиды, бюджет, CPL. Пилот vs контрольная группа.",
      },
    ],
  }),
  component: PilotReport,
});

type Metric = "leads" | "budget" | "cpl";

const METRIC_DATA: Record<
  Metric,
  { label: string; data: ReturnType<typeof buildSeries>; fmt: (v: number) => string }
> = {
  leads: { label: "Лиды", data: buildSeries(LEADS), fmt: (v) => nf.format(v) },
  budget: { label: "Бюджет", data: buildSeries(BUDGET), fmt: (v) => nfRub.format(v) },
  cpl: { label: "CPL", data: buildSeries(CPL), fmt: (v) => nfRub.format(v) },
};

const SEGMENT_CHART_COLORS: Record<SegmentKey, string> = {
  msk: "#00b5f0",
  regions: "#e6007e",
  pilot: "#f7941d",
  control: "#58595b",
};

const TOOLTIP_STYLE = {
  background: "rgba(15, 23, 42, 0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#f8fafc",
};

function Chart({ metric, active }: { metric: Metric; active: SegmentKey[] }) {
  const { data, fmt } = METRIC_DATA[metric];
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="week" stroke="#8a8b8d" fontSize={12} />
          <YAxis stroke="#8a8b8d" fontSize={12} tickFormatter={(v) => nf.format(v)} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmt(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
          <ReferenceLine
            x="22 июня"
            stroke="#f7941d"
            strokeDasharray="4 4"
            label={{
              value: "Старт пилота",
              position: "insideTopRight",
              fill: "#f7941d",
              fontSize: 11,
            }}
          />
          {SEGMENTS.filter((s) => active.includes(s.key)).map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={SEGMENT_CHART_COLORS[s.key]}
              strokeWidth={s.key === "pilot" ? 3 : 2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function SegmentCard({ seg }: { seg: SegmentKey }) {
  const label = SEGMENTS.find((s) => s.key === seg)!.label;
  const leads = DELTAS.leads[seg];
  const cpl = DELTAS.cpl[seg];
  const budget = DELTAS.budget[seg];
  const lastIdx = 5;
  const isPilot = seg !== "control";

  return (
    <div className={`glass-card p-6 ${isPilot ? "pilot-glow" : ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{label}</h3>
        {isPilot ? (
          <span className="rounded-full bg-[#f7941d]/15 px-2.5 py-0.5 text-xs font-medium text-[#f7941d]">
            Пилот
          </span>
        ) : (
          <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs font-medium text-slate-400">
            Контроль
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-slate-400">Лиды (22.06)</dt>
          <dd className="text-2xl font-bold text-white">{nf.format(LEADS[seg][lastIdx])}</dd>
          <dd className="text-xs">
            н/н <DeltaValue value={leads.wow} />
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">CPL (22.06)</dt>
          <dd className="text-2xl font-bold text-white">{nfRub.format(CPL[seg][lastIdx])}</dd>
          <dd className="text-xs">
            н/н <DeltaValue value={cpl.wow} lowerIsBetter />
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Бюджет</dt>
          <dd className="font-semibold text-white">{nfRub.format(BUDGET[seg][lastIdx])}</dd>
          <dd className="text-xs">
            н/н <DeltaValue value={budget.wow} lowerIsBetter />
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Рост лидов к ср. 5 нед.</dt>
          <dd className="font-semibold">
            <DeltaValue value={leads.vs5} />
          </dd>
          <dd className="text-xs text-slate-500">
            ср. {nf.format(leads.avg5)} → {nf.format(LEADS[seg][lastIdx])}
          </dd>
        </div>
        <div className="col-span-2 border-t border-white/8 pt-3">
          <dt className="text-xs text-slate-400">Изменение CPL</dt>
          <dd className="mt-1 flex gap-4 text-sm">
            <span>
              к ср. 5 нед.: <DeltaValue value={cpl.vs5} lowerIsBetter />
            </span>
            <span>
              к ср. 3 нед.: <DeltaValue value={cpl.vs3} lowerIsBetter />
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}

function PilotReport() {
  const [metric, setMetric] = useState<Metric>("leads");
  const [active, setActive] = useState<SegmentKey[]>(["msk", "regions", "pilot", "control"]);

  const toggle = (k: SegmentKey) =>
    setActive((a) => (a.includes(k) ? a.filter((x) => x !== k) : [...a, k]));

  const insight = useMemo(() => {
    if (metric === "leads")
      return "Пилот вырос на +23,66% за неделю и на +41,18% относительно среднего за 5 недель — это в 2× быстрее контрольной группы (+20,84%).";
    if (metric === "budget")
      return "Бюджет пилота снизился на −7,4% н/н. Рост лидов получен без увеличения вложений — перераспределили из МСК+СПб в регионы.";
    return "CPL по МСК + СПб упал на −46,67% за неделю и на −38% к среднему за 5 недель. В регионах CPL вырос — закономерно при масштабировании объёма.";
  }, [metric]);

  const barData = SEGMENTS.map((s) => ({
    name: s.label,
    leads: LEADS[s.key][5],
    fill: SEGMENT_CHART_COLORS[s.key],
  }));

  return (
    <div className="report-page">
      <ReportHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-16 pt-10 md:px-8 md:pb-20 md:pt-14">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-brand-gradient-soft" />
          <div className="relative mx-auto max-w-7xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-hr-blue)]/30 bg-[rgba(0,181,240,0.1)] px-4 py-1.5 text-sm font-medium text-[var(--color-hr-blue)]">
              <span className="h-2 w-2 rounded-full bg-[var(--color-hr-orange)]" />
              Пилот HR-Rocket · лидогенерация
            </div>

            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl">
              <span className="text-brand-gradient">+41,18% лидов</span> за первую неделю пилота
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-slate-400">
              Результаты пилота для <strong className="font-semibold text-white">IRB Family</strong>{" "}
              по сегментам <strong className="font-semibold text-white">МСК + СПб</strong> и{" "}
              <strong className="font-semibold text-white">10 регионов</strong>. Сравнение baseline
              (5 недель до пилота) и стартовой недели пилота с контрольной группой городов.
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
              <span className="rounded-full border border-white/10 px-3 py-1">
                До: 18 мая — 15 июня
              </span>
              <span className="rounded-full border border-[var(--color-hr-orange)]/40 bg-[rgba(247,148,29,0.12)] px-3 py-1 text-[var(--color-hr-orange)]">
                С HR Rocket: 22 июня
              </span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                title="Лиды · весь пилот"
                value={fmtPct(DELTAS.leads.pilot.vs5)}
                valueDelta={DELTAS.leads.pilot.vs5}
                subtitle={`${nf.format(DELTAS.leads.pilot.avg5)} → ${nf.format(LEADS.pilot[5])} / нед`}
                accent="accent"
                deltas={[
                  { label: "к прошлой неделе", value: DELTAS.leads.pilot.wow },
                  { label: "к ср. 3 недель", value: DELTAS.leads.pilot.vs3 },
                ]}
              />
              <KpiCard
                title="CPL · весь пилот"
                value={fmtPct(DELTAS.cpl.pilot.vs5)}
                valueDelta={DELTAS.cpl.pilot.vs5}
                lowerIsBetter
                subtitle={`${nfRub.format(CPL.pilot[5])} — −25,12% за неделю`}
                accent="brand"
                deltas={[
                  { label: "к прошлой неделе", value: DELTAS.cpl.pilot.wow, lowerIsBetter: true },
                  { label: "к ср. 3 недель", value: DELTAS.cpl.pilot.vs3, lowerIsBetter: true },
                ]}
              />
              <KpiCard
                title="Лиды · регионы"
                value={fmtPct(DELTAS.leads.regions.vs5)}
                valueDelta={DELTAS.leads.regions.vs5}
                subtitle="10 городов-регионов · +28% н/н"
                accent="warn"
                deltas={[
                  { label: "к прошлой неделе", value: DELTAS.leads.regions.wow },
                  { label: "к ср. 3 недель", value: DELTAS.leads.regions.vs3 },
                ]}
              />
              <KpiCard
                title="CPL · МСК + СПб"
                value={fmtPct(DELTAS.cpl.msk.wow)}
                valueDelta={DELTAS.cpl.msk.wow}
                lowerIsBetter
                subtitle="−46,67% за неделю — лид почти вдвое дешевле"
                accent="brand"
                deltas={[
                  { label: "к ср. 5 недель", value: DELTAS.cpl.msk.vs5, lowerIsBetter: true },
                  { label: "к ср. 3 недель", value: DELTAS.cpl.msk.vs3, lowerIsBetter: true },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Goals */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              id="goals"
              eyebrow="Цели пилота"
              title="Что ставили перед HR-Rocket"
              description="Пилот запущен 22 июня для оценки эффективности управления лидогенерацией в МСК+СПб и регионах с контрольной группой."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <GoalCard
                title="Главная цель"
                items={[
                  "Увеличение количества лидов",
                  "Снижение CPL при масштабировании",
                  "Сравнение с контрольной группой",
                ]}
                accent="accent"
              />
              <GoalCard
                title="Периметр пилота"
                items={["МСК + СПб", "10 городов-регионов", "Старт: 22 июня 2026"]}
                accent="brand"
              />
              <GoalCard
                title="Метрики"
                items={["Лиды (отклики)", "CPL (стоимость лида)", "Бюджет на продвижение"]}
                accent="warn"
              />
            </div>
          </div>
        </section>

        {/* Dynamics */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              id="dynamics"
              eyebrow="Динамика"
              title="До / С HR Rocket"
              description="18 мая → 22 июня · последняя точка — старт пилота"
            />
            <div className="glass-card p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-end gap-4">
                <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 text-sm">
                  {(["leads", "budget", "cpl"] as Metric[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetric(m)}
                      className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                        metric === m
                          ? "bg-brand-gradient text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {METRIC_DATA[m].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SEGMENTS.map((s) => {
                  const on = active.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      onClick={() => toggle(s.key)}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                        on
                          ? "border-white/20 bg-white/8 text-white"
                          : "border-white/5 bg-white/3 text-slate-500 opacity-60"
                      }`}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: SEGMENT_CHART_COLORS[s.key] }}
                      />
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <Chart metric={metric} active={active} />
              </div>

              <p className="mt-4 text-sm text-slate-400">{insight}</p>
            </div>
          </div>
        </section>

        {/* Pilot vs Control */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              id="pilot-vs-control"
              eyebrow="Ключевое доказательство"
              title="Пилот vs Контрольная группа"
              description="На сопоставимых типах городов пилот растёт ощутимо быстрее."
            />
            <div className="glass-card p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-[#f7941d]/30 bg-[#f7941d]/8 p-6 pilot-glow">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#f7941d]">
                    Пилот
                  </div>
                  <div className="mt-4 space-y-4">
                    <CompareRow
                      label="Рост лидов (к ср. 5 нед.)"
                      value={fmtPct(DELTAS.leads.pilot.vs5)}
                      positive
                    />
                    <CompareRow
                      label="Рост лидов (к ср. 3 нед.)"
                      value={fmtPct(DELTAS.leads.pilot.vs3)}
                      positive
                    />
                    <CompareRow
                      label="Изменение CPL (к ср. 5 нед.)"
                      value={fmtPct(DELTAS.cpl.pilot.vs5)}
                      positive
                    />
                    <CompareRow label="Лиды на неделе пилота" value={nf.format(LEADS.pilot[5])} />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/4 p-6">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Контрольная группа
                  </div>
                  <div className="mt-4 space-y-4">
                    <CompareRow
                      label="Рост лидов (к ср. 5 нед.)"
                      value={fmtPct(DELTAS.leads.control.vs5)}
                    />
                    <CompareRow
                      label="Рост лидов (к ср. 3 нед.)"
                      value={fmtPct(DELTAS.leads.control.vs3)}
                    />
                    <CompareRow
                      label="Изменение CPL (к ср. 5 нед.)"
                      value={fmtPct(DELTAS.cpl.control.vs5)}
                    />
                    <CompareRow label="Лиды на той же неделе" value={nf.format(LEADS.control[5])} />
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm">
                <span className="font-semibold text-emerald-400">Вывод: </span>
                <span className="text-slate-200">
                  Пилот дал прирост лидов <b className="text-white">+41,18%</b> против{" "}
                  <b className="text-white">+20,84%</b> у контрольной — рост почти в 2× быстрее при
                  сопоставимом периметре.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Segments */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              id="segments"
              eyebrow="Сегменты"
              title="Разбивка по сегментам"
              description="Детализация по МСК+СПб, регионам, всему пилоту и контрольной группе."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <SegmentCard seg="msk" />
              <SegmentCard seg="regions" />
              <SegmentCard seg="pilot" />
              <SegmentCard seg="control" />
            </div>

            <div className="glass-card mt-8 p-6">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Лиды на неделе пилота (22.06)
              </h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer>
                  <BarChart data={barData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" stroke="#8a8b8d" fontSize={12} />
                    <YAxis stroke="#8a8b8d" fontSize={12} tickFormatter={(v) => nf.format(v)} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => nf.format(Number(v))} />
                    <Bar dataKey="leads" name="Лиды" radius={[6, 6, 0, 0]}>
                      {barData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* What we did */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              id="whatwedid"
              eyebrow="Что реализовали"
              title="Что сделали в пилоте"
              description="Ключевые действия в рамках первой недели пилота HR-Rocket для IRB Family."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <ActionCard
                index={1}
                title="Перераспределение бюджета"
                text="Снизили вложения в МСК+СПб (−42,5% н/н) и направили ресурсы в регионы с высоким потенциалом роста."
              />
              <ActionCard
                index={2}
                title="Оптимизация CPL"
                text="CPL по МСК+СПб снижен на −46,67% за неделю — лид стал почти вдвое дешевле без потери объёма."
              />
              <ActionCard
                index={3}
                title="Масштабирование регионов"
                text="10 городов-регионов показали +28% лидов н/н — рост объёма при контролируемом CPL."
              />
              <ActionCard
                index={4}
                title="A/B-сравнение с контролем"
                text="Параллельный мониторинг контрольной группы подтвердил: эффект пилота — не сезонность, а результат управления."
              />
            </div>
          </div>
        </section>

        {/* Conclusions + CTA */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              id="conclusions"
              eyebrow="Итог"
              title="Ключевые выводы пилота"
              description="HR-Rocket доказал эффективность на реальных данных IRB Family. Готовы масштабировать на постоянной основе."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {CONCLUSIONS.map((item) => (
                <div key={item.title} className="glass-card p-5">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(0,181,240,0.15)] text-[var(--color-hr-blue)]">
                    ✓
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="glass-card mt-6 p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-hr-pink)]">
                Итог пилота
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-300 md:text-lg">
                Первая неделя пилота подтвердила потенциал масштабирования: рост лидов в 2× быстрее
                контрольной группы при снижении CPL по МСК+СПб на 46,67%. Бюджет пилота снизился на
                7,4% при росте объёма — эффективность выросла. Клиент положительно оценивает
                результаты. Считаем пилот успешным и готовы переходить к этапу{" "}
                <span className="font-semibold text-white">лицензирования</span>.
              </p>
            </div>

            <div className="mt-6 rounded-3xl border border-[var(--color-hr-blue)]/20 bg-brand-gradient-soft p-8 md:p-10">
              <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-hr-pink)]">
                    Результат пилота
                  </p>
                  <h3 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">
                    <span className="text-brand-gradient">+41,18% лидов</span>
                    <br />в 2× быстрее контроля
                  </h3>
                  <p className="mt-4 max-w-xl text-slate-300">
                    С {nf.format(DELTAS.leads.pilot.avg5)} до {nf.format(LEADS.pilot[5])} лидов в
                    неделю по периметру МСК+СПб и регионов.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <a
                    href="https://t.me/dmitrysaushkin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-brand"
                  >
                    Подключить HR-Rocket
                  </a>
                  <p className="text-center text-xs text-slate-500">
                    Данные: лидогенерация · 18 мая — 22 июня 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              id="roadmap"
              eyebrow="Дальнейшие шаги"
              title="Куда двигаемся после пилота"
              description="Пилот подтвердил модель. Следующий этап — масштабирование и лицензирование HR-Rocket."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <RoadmapStep
                step="1"
                title="2-я неделя пилота"
                items={[
                  "Закрепление результатов первой недели",
                  "Мониторинг CPL в регионах",
                  "Корректировка ставок",
                ]}
              />
              <RoadmapStep
                step="2"
                title="Расширение периметра"
                items={[
                  "Подключение дополнительных городов",
                  "Масштабирование успешных стратегий",
                  "A/B-тесты по сегментам",
                ]}
              />
              <RoadmapStep
                step="3"
                title="Лицензирование"
                items={[
                  "Переход на полную лицензию HR-Rocket",
                  "Автоматизация управления кампаниями",
                  "Единый дашборд по всем сегментам",
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 px-4 py-10 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 md:flex-row md:justify-between">
          <BrandBar compact />
          <p className="text-center text-sm text-[var(--color-hr-grey-light)] md:text-right">
            Аналитика пилота · Июнь 2026 · IRB Family
          </p>
        </div>
      </footer>
    </div>
  );
}

const CONCLUSIONS = [
  {
    title: "+41,18% лидов — в 2× быстрее контроля",
    text: "Пилот дал +41,18% к среднему за 5 недель против +20,84% у контрольной группы — рост почти вдвое быстрее.",
  },
  {
    title: "CPL по МСК+СПб −46,67% за неделю",
    text: "Лид стал почти вдвое дешевле без потери объёма — ключевой результат оптимизации ставок.",
  },
  {
    title: "Регионы: +28% лидов н/н",
    text: "10 городов показали рост объёма — закономерный рост CPL при масштабировании.",
  },
  {
    title: "Бюджет −7,4% при росте лидов",
    text: "Перераспределение из МСК+СПб в регионы дало рост эффективности без увеличения вложений.",
  },
];

function GoalCard({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: "accent" | "brand" | "warn";
}) {
  const border =
    accent === "accent"
      ? "border-emerald-400/20"
      : accent === "brand"
        ? "border-cyan-400/20"
        : "border-amber-400/20";

  return (
    <div className={`glass-card p-6 ${border}`}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-slate-400">
            <span className="text-cyan-400">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionCard({ index, title, text }: { index: number; title: string; text: string }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-300">
        {index}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{text}</p>
    </div>
  );
}

function RoadmapStep({ step, title, items }: { step: string; title: string; items: string[] }) {
  return (
    <div className="glass-card p-5">
      <p className="text-sm font-semibold text-cyan-400">Шаг {step}</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-400">
            <span className="text-emerald-400">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompareRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-lg font-bold ${positive ? "text-emerald-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}
