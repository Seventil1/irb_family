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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Пилот ИРБ — итоги 1-й недели" },
      {
        name: "description",
        content:
          "Результаты первой недели пилота лидогенерации: рост лидов в 2× быстрее контрольной группы, снижение CPL по МСК+СПб на 46,67%.",
      },
      { property: "og:title", content: "Пилот ИРБ — итоги 1-й недели" },
      {
        property: "og:description",
        content: "Интерактивный отчёт: лиды, бюджет, CPL. Пилот vs контрольная группа.",
      },
    ],
  }),
  component: PilotReport,
});

type Metric = "leads" | "budget" | "cpl";

const METRIC_DATA: Record<Metric, { label: string; data: ReturnType<typeof buildSeries>; fmt: (v: number) => string }> = {
  leads: { label: "Лиды", data: buildSeries(LEADS), fmt: (v) => nf.format(v) },
  budget: { label: "Бюджет", data: buildSeries(BUDGET), fmt: (v) => nfRub.format(v) },
  cpl: { label: "CPL", data: buildSeries(CPL), fmt: (v) => nfRub.format(v) },
};

function Delta({ v, invert = false }: { v: number; invert?: boolean }) {
  // invert=true => уменьшение = успех (для CPL)
  const positive = invert ? v < 0 : v > 0;
  const cls = positive ? "text-success" : v === 0 ? "text-muted-foreground" : "text-destructive";
  return <span className={`font-semibold ${cls}`}>{fmtPct(v)}</span>;
}

function KpiCard({
  title,
  value,
  subtitle,
  deltas,
}: {
  title: string;
  value: string;
  subtitle: string;
  deltas: { label: string; value: number; invert?: boolean }[];
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-4xl font-bold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
      <div className="mt-4 space-y-1.5 text-sm">
        {deltas.map((d) => (
          <div key={d.label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{d.label}</span>
            <Delta v={d.value} invert={d.invert} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Chart({ metric, active }: { metric: Metric; active: SegmentKey[] }) {
  const { data, fmt } = METRIC_DATA[metric];
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 12, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="week" stroke="var(--color-muted-foreground)" fontSize={12} />
          <YAxis
            stroke="var(--color-muted-foreground)"
            fontSize={12}
            tickFormatter={(v) => (metric === "leads" ? nf.format(v) : nf.format(v))}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              color: "var(--color-popover-foreground)",
            }}
            formatter={(v: number) => fmt(v)}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            x="22 июня"
            stroke="var(--color-pilot)"
            strokeDasharray="4 4"
            label={{ value: "Старт пилота", position: "insideTopRight", fill: "var(--color-pilot)", fontSize: 11 }}
          />
          {SEGMENTS.filter((s) => active.includes(s.key)).map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
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
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{label}</h3>
        {seg !== "control" ? (
          <span className="rounded-full bg-pilot/10 px-2.5 py-0.5 text-xs font-medium text-pilot">Пилот</span>
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            Контроль
          </span>
        )}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Лиды (22.06)</dt>
          <dd className="text-2xl font-bold text-foreground">{nf.format(LEADS[seg][lastIdx])}</dd>
          <dd className="text-xs">
            н/н <Delta v={leads.wow} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">CPL (22.06)</dt>
          <dd className="text-2xl font-bold text-foreground">{nfRub.format(CPL[seg][lastIdx])}</dd>
          <dd className="text-xs">
            н/н <Delta v={cpl.wow} invert />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Бюджет</dt>
          <dd className="font-semibold text-foreground">{nfRub.format(BUDGET[seg][lastIdx])}</dd>
          <dd className="text-xs">
            н/н <Delta v={budget.wow} invert />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Рост лидов к ср. 5 нед.</dt>
          <dd className="font-semibold">
            <Delta v={leads.vs5} />
          </dd>
          <dd className="text-xs text-muted-foreground">
            ср. {nf.format(leads.avg5)} → {nf.format(LEADS[seg][lastIdx])}
          </dd>
        </div>
        <div className="col-span-2 border-t pt-3">
          <dt className="text-muted-foreground text-xs">Изменение CPL</dt>
          <dd className="mt-1 flex gap-4 text-sm">
            <span>
              к ср. 5 нед.: <Delta v={cpl.vs5} invert />
            </span>
            <span>
              к ср. 3 нед.: <Delta v={cpl.vs3} invert />
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
    return "CPL по МСК+СПб упал на −46,67% за неделю и на −38% к среднему за 5 недель. В регионах CPL вырос — закономерно при масштабировании объёма.";
  }, [metric]);

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <header className="border-b bg-gradient-to-b from-pilot/5 to-transparent">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-pilot">
            <span className="h-2 w-2 rounded-full bg-pilot" />
            Отчёт по пилоту · неделя 22 июня
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground lg:text-5xl">
            Пилот лидогенерации — итоги 1-й недели
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground lg:text-lg">
            МСК + СПб и 10 городов-регионов вошли в пилот. Сравниваем результат стартовой недели с 5
            неделями работы клиента до пилота и с контрольной группой городов.
          </p>
        </div>
      </header>

      {/* KPI */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Лиды · весь пилот"
            value={nf.format(LEADS.pilot[5])}
            subtitle="за неделю 22 июня"
            deltas={[
              { label: "к прошлой неделе", value: DELTAS.leads.pilot.wow },
              { label: "к ср. 5 недель", value: DELTAS.leads.pilot.vs5 },
              { label: "к ср. 3 недель", value: DELTAS.leads.pilot.vs3 },
            ]}
          />
          <KpiCard
            title="CPL · весь пилот"
            value={nfRub.format(CPL.pilot[5])}
            subtitle="−25,12% за неделю"
            deltas={[
              { label: "к прошлой неделе", value: DELTAS.cpl.pilot.wow, invert: true },
              { label: "к ср. 5 недель", value: DELTAS.cpl.pilot.vs5, invert: true },
              { label: "к ср. 3 недель", value: DELTAS.cpl.pilot.vs3, invert: true },
            ]}
          />
          <KpiCard
            title="Лиды · регионы"
            value={nf.format(LEADS.regions[5])}
            subtitle="10 городов-регионов"
            deltas={[
              { label: "к прошлой неделе", value: DELTAS.leads.regions.wow },
              { label: "к ср. 5 недель", value: DELTAS.leads.regions.vs5 },
              { label: "к ср. 3 недель", value: DELTAS.leads.regions.vs3 },
            ]}
          />
          <KpiCard
            title="CPL · МСК + СПб"
            value={nfRub.format(CPL.msk[5])}
            subtitle="−46,67% за неделю"
            deltas={[
              { label: "к прошлой неделе", value: DELTAS.cpl.msk.wow, invert: true },
              { label: "к ср. 5 недель", value: DELTAS.cpl.msk.vs5, invert: true },
              { label: "к ср. 3 недель", value: DELTAS.cpl.msk.vs3, invert: true },
            ]}
          />
        </div>
      </section>

      {/* PILOT vs CONTROL */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-3xl border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Пилот vs Контрольная группа</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Главное доказательство: на тех же типах городов пилот растёт ощутимо быстрее.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-pilot/30 bg-pilot/5 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-pilot">Пилот</div>
              <div className="mt-4 space-y-4">
                <Row label="Рост лидов (к ср. 5 нед.)" value={fmtPct(DELTAS.leads.pilot.vs5)} positive />
                <Row label="Рост лидов (к ср. 3 нед.)" value={fmtPct(DELTAS.leads.pilot.vs3)} positive />
                <Row label="Изменение CPL (к ср. 5 нед.)" value={fmtPct(DELTAS.cpl.pilot.vs5)} positive />
                <Row label="Лиды на неделе пилота" value={nf.format(LEADS.pilot[5])} />
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Контрольная группа
              </div>
              <div className="mt-4 space-y-4">
                <Row label="Рост лидов (к ср. 5 нед.)" value={fmtPct(DELTAS.leads.control.vs5)} />
                <Row label="Рост лидов (к ср. 3 нед.)" value={fmtPct(DELTAS.leads.control.vs3)} />
                <Row label="Изменение CPL (к ср. 5 нед.)" value={fmtPct(DELTAS.cpl.control.vs5)} />
                <Row label="Лиды на той же неделе" value={nf.format(LEADS.control[5])} />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-success/10 p-4 text-sm">
            <span className="font-semibold text-success">Вывод: </span>
            <span className="text-foreground">
              Пилот дал прирост лидов <b>+41,18%</b> против <b>+20,84%</b> у контрольной — рост почти
              в 2× быстрее при сопоставимом периметре.
            </span>
          </div>
        </div>
      </section>

      {/* CHARTS */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="rounded-3xl border bg-card p-6 shadow-sm lg:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Динамика по неделям</h2>
              <p className="text-sm text-muted-foreground">18 мая → 22 июня · последняя точка — старт пилота</p>
            </div>
            <div className="flex rounded-lg border bg-muted/40 p-1 text-sm">
              {(["leads", "budget", "cpl"] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    metric === m
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
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
                    on ? "bg-card text-foreground" : "bg-muted/40 text-muted-foreground opacity-60"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <Chart metric={metric} active={active} />
          </div>

          <p className="mt-4 text-sm text-muted-foreground">{insight}</p>
        </div>
      </section>

      {/* SEGMENTS */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <h2 className="text-2xl font-bold text-foreground">Разбивка по сегментам</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SegmentCard seg="msk" />
          <SegmentCard seg="regions" />
          <SegmentCard seg="pilot" />
          <SegmentCard seg="control" />
        </div>
      </section>

      {/* SUMMARY */}
      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border bg-gradient-to-br from-pilot/10 via-card to-card p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-foreground">Что показала первая неделя</h2>
          <ul className="mt-5 grid gap-3 text-sm text-foreground md:grid-cols-2">
            <Bullet>
              Рост лидов в пилоте <b>в 2× быстрее</b> контрольной группы (+41,18% против +20,84%).
            </Bullet>
            <Bullet>
              CPL по МСК + СПб снижен <b>на −46,67%</b> за неделю — лид стал почти вдвое дешевле.
            </Bullet>
            <Bullet>
              В регионах <b>+28% лидов</b> н/н с прогнозируемым ростом CPL — это масштабирование объёма.
            </Bullet>
            <Bullet>
              Общий бюджет пилота <b>снизился на −7,4%</b> при росте лидов — эффективность выросла.
            </Bullet>
          </ul>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-6 text-xs text-muted-foreground">
          Период данных: 18 мая — 22 июня. Неделя стартует с понедельника. Контрольная группа —
          города, не вошедшие в пилот, с сопоставимым объёмом активности до периода сравнения.
        </div>
      </footer>
    </div>
  );
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-lg font-bold ${positive ? "text-success" : "text-foreground"}`}>{value}</span>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-xl border bg-card/60 p-4">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-pilot" />
      <span>{children}</span>
    </li>
  );
}
