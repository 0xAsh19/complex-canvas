import { useState, useMemo, useCallback } from "react";
import Plot from "react-plotly.js";
import * as math from "mathjs";

const PRESETS = [
  { label: "z²", value: "z^2" },
  { label: "sin(z)", value: "sin(z)" },
  { label: "z³ - 1", value: "z^3 - 1" },
  { label: "exp(z)", value: "exp(z)" },
  { label: "1/z", value: "1/z" },
  { label: "z·sin(z)", value: "z * sin(z)" },
  { label: "log(z)", value: "log(z)" },
  { label: "tan(z)", value: "tan(z)" },
];

const GRID_SIZE = 150;

function generateSurface(funcStr: string, range: number) {
  const n = GRID_SIZE;
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    x.push(-range + (2 * range * i) / (n - 1));
    y.push(-range + (2 * range * i) / (n - 1));
  }

  const zData: number[][] = [];
  const compiled = math.compile(funcStr);

  for (let j = 0; j < n; j++) {
    const row: number[] = [];
    for (let i = 0; i < n; i++) {
      try {
        const z = math.complex(x[i], y[j]);
        const result = compiled.evaluate({ z, i: math.complex(0, 1) });
        const magnitude = typeof result === "number" 
          ? Math.abs(result) 
          : math.abs(result) as number;
        row.push(Math.min(magnitude, 50)); // clamp to avoid infinities
      } catch {
        row.push(NaN);
      }
    }
    zData.push(row);
  }

  return { x, y, z: zData };
}

export default function ComplexVisualizer() {
  const [funcInput, setFuncInput] = useState("z^2");
  const [activeFunc, setActiveFunc] = useState("z^2");
  const [range, setRange] = useState(5);
  const [error, setError] = useState("");

  const handleVisualize = useCallback(() => {
    try {
      // test parse
      const compiled = math.compile(funcInput);
      compiled.evaluate({ z: math.complex(1, 1), i: math.complex(0, 1) });
      setError("");
      setActiveFunc(funcInput);
    } catch (e: any) {
      setError("Invalid function. Try: z^2, sin(z), exp(z)");
    }
  }, [funcInput]);

  const surface = useMemo(() => {
    try {
      return generateSurface(activeFunc, range);
    } catch {
      return null;
    }
  }, [activeFunc, range]);

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-mono text-sm font-bold">ℂ</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
              Complex Surface Visualizer
            </h1>
            <p className="text-xs text-muted-foreground">
              Explore |f(z)| over the complex plane
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col lg:flex-row gap-6">
        {/* Controls Panel */}
        <aside className="lg:w-80 shrink-0 space-y-5">
          {/* Function input */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <label className="text-sm font-medium text-foreground block">
              Function f(z)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={funcInput}
                onChange={(e) => setFuncInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVisualize()}
                className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="e.g. z^2, sin(z)"
              />
              <button
                onClick={handleVisualize}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary"
              >
                Plot
              </button>
            </div>
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          {/* Presets */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <label className="text-sm font-medium text-foreground block">
              Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setFuncInput(p.value);
                    setError("");
                    setActiveFunc(p.value);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-mono transition-all ${
                    activeFunc === p.value
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Range */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground">Range</label>
              <span className="text-xs font-mono text-muted-foreground">
                [{-range}, {range}]
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={range}
              onChange={(e) => setRange(Number(e.target.value))}
              className="w-full accent-primary"
              style={{ accentColor: "hsl(175 80% 50%)" }}
            />
          </div>

          {/* Info */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The surface shows <span className="font-mono text-foreground">|f(z)|</span> where{" "}
              <span className="font-mono text-foreground">z = x + iy</span>. 
              The x-axis is the real part, y-axis is the imaginary part, and height represents the magnitude.
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: <span className="font-mono text-primary/80">sin cos tan exp log sqrt abs</span> and arithmetic operators.
            </p>
          </div>
        </aside>

        {/* 3D Plot */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden min-h-[500px] flex items-center justify-center">
          {surface ? (
            <Plot
              data={[
                {
                  type: "surface",
                  x: surface.x,
                  y: surface.y,
                  z: surface.z,
                  colorscale: "Viridis",
                  showscale: true,
                  colorbar: {
                    thickness: 15,
                    len: 0.6,
                    tickfont: { color: "#8899aa", size: 10, family: "JetBrains Mono" },
                    title: { text: "|f(z)|", font: { color: "#aabbcc", size: 12, family: "Space Grotesk" } },
                  },
                  contours: {
                    z: { show: true, usecolormap: true, highlightcolor: "#00e5cc", project: { z: false } },
                  },
                },
              ]}
              layout={{
                autosize: true,
                paper_bgcolor: "rgba(0,0,0,0)",
                plot_bgcolor: "rgba(0,0,0,0)",
                margin: { l: 0, r: 0, t: 30, b: 0 },
                title: {
                  text: `|f(z)| for f(z) = ${activeFunc}`,
                  font: { color: "#c8d6e5", size: 14, family: "Space Grotesk" },
                },
                scene: {
                  xaxis: {
                    title: { text: "Real Axis", font: { color: "#8899aa", size: 11, family: "Space Grotesk" } },
                    gridcolor: "rgba(100,120,140,0.15)",
                    zerolinecolor: "rgba(100,120,140,0.3)",
                    color: "#667788",
                  },
                  yaxis: {
                    title: { text: "Imaginary Axis", font: { color: "#8899aa", size: 11, family: "Space Grotesk" } },
                    gridcolor: "rgba(100,120,140,0.15)",
                    zerolinecolor: "rgba(100,120,140,0.3)",
                    color: "#667788",
                  },
                  zaxis: {
                    title: { text: "|f(z)|", font: { color: "#8899aa", size: 11, family: "Space Grotesk" } },
                    gridcolor: "rgba(100,120,140,0.15)",
                    zerolinecolor: "rgba(100,120,140,0.3)",
                    color: "#667788",
                  },
                  bgcolor: "rgba(0,0,0,0)",
                },
              }}
              config={{
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ["toImage", "sendDataToCloud"],
              }}
              useResizeHandler
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <p className="text-muted-foreground text-sm">Enter a valid function to visualize</p>
          )}
        </div>
      </main>
    </div>
  );
}
