import { useEffect, useRef, useState, useMemo } from 'react';
import { Bot, Plus, Pause, Play, Trash2, Zap, Activity } from 'lucide-react';
import { useAgents, useCreateAgent, useToggleAgent, useDeleteAgent } from '../api/agents';
import type { Agent } from '../api/agents';

// ── Deterministic sparkline per agent (stable across renders) ──────────────────

function hashInt(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function seededRand(seed: number, i: number): number {
  const x = Math.sin(seed + i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function agentSparkline(id: string): number[] {
  const seed = hashInt(id);
  return Array.from({ length: 16 }, (_, i) => seededRand(seed, i) * 90 + 10);
}

// ── Neural network canvas ──────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number; phase: number; speed: number;
}

function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const N = 48;
    const particles: Particle[] = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 1,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.025 + 0.008,
    }));

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.phase += p.speed;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      // connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.hypot(dx, dy);
          if (d < 130) {
            const alpha = (1 - d / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(220,38,38,${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // nodes
      for (const p of particles) {
        const a = 0.25 + 0.2 * Math.sin(p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,${a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />;
}

// ── Sparkline SVG ──────────────────────────────────────────────────────────────

function Sparkline({ data, color = '#ef4444' }: { data: number[]; color?: string }) {
  const W = 100; const H = 32;
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const rng = hi - lo || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - ((v - lo) / rng) * (H - 4) - 2,
  ] as [number, number]);
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const gid  = `sg_${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line}  fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── PulseDot ──────────────────────────────────────────────────────────────────

function PulseDot({ active }: { active: boolean }) {
  if (!active) return <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />;
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

// ── Agent card ────────────────────────────────────────────────────────────────

function AgentCard({ agent }: { agent: Agent }) {
  const spark   = useMemo(() => agentSparkline(agent.id), [agent.id]);
  const toggle  = useToggleAgent(agent.id, agent.isActive);
  const destroy = useDeleteAgent();

  return (
    <div className={`relative bg-[#141720] rounded-2xl border transition-all duration-300 overflow-hidden
      ${agent.isActive
        ? 'border-red-900/50 shadow-[0_0_18px_-4px_rgba(239,68,68,0.12)]'
        : 'border-white/[0.05]'
      }`}
    >
      {/* top glow line */}
      {agent.isActive && (
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
      )}

      <div className="p-5">
        {/* header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <PulseDot active={agent.isActive} />
            <div>
              <p className="text-[13px] font-semibold text-slate-100 leading-tight">{agent.name}</p>
              <p className="text-[10px] font-mono text-slate-600 mt-0.5">v{agent.version}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggle.mutate()}
              disabled={toggle.isPending}
              title={agent.isActive ? 'Pause agent' : 'Activate agent'}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/[0.06] transition-colors"
            >
              {agent.isActive ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              onClick={() => destroy.mutate(agent.id)}
              disabled={destroy.isPending}
              title="Delete agent"
              className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* description */}
        {agent.description && (
          <p className="text-[11px] text-slate-600 mb-3 leading-relaxed line-clamp-2">
            {agent.description}
          </p>
        )}

        {/* sparkline */}
        <div className="mb-3 -mx-1">
          <Sparkline
            data={spark}
            color={agent.isActive ? '#ef4444' : '#475569'}
          />
        </div>

        {/* footer */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-medium
            ${agent.isActive
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-700/50 text-slate-500'
            }`}>
            {agent.isActive ? 'ACTIVE' : 'PAUSED'}
          </span>
          <span className="text-[10px] font-mono text-slate-700 truncate max-w-[120px]" title={agent.publicKey}>
            {agent.publicKey.slice(0, 16)}…
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Live activity feed ────────────────────────────────────────────────────────

const ACTIONS  = ['Transfer', 'Swap', 'Stake', 'Approve', 'Withdraw', 'Bridge'];
const TARGETS  = ['0x1a2b…f9c3', '0x9f3c…ab12', '0x4d7e…3301', '0xab12…ee07', '0xcc91…1fa0'];
const AMOUNTS  = ['0.05 ETH', '0.12 ETH', '1.50 USDC', '25.0 MATIC', '0.003 BTC', '100 USDC'];
type LogStatus = 'confirmed' | 'pending';
const STATUSES: LogStatus[] = ['confirmed', 'confirmed', 'confirmed', 'pending', 'confirmed'];

interface LogEntry {
  id: string;
  ts: string;
  agent: string;
  action: string;
  target: string;
  amount: string;
  status: LogStatus;
}

function pick<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function LiveFeed({ agentNames }: { agentNames: string[] }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (agentNames.length === 0) return;

    const add = () => {
      setLogs(prev => [{
        id: Math.random().toString(36).slice(2),
        ts: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        agent: pick(agentNames),
        action: pick(ACTIONS),
        target: pick(TARGETS),
        amount: pick(AMOUNTS),
        status: pick(STATUSES),
      }, ...prev].slice(0, 40));
    };

    add(); // immediate first entry
    const id = setInterval(add, 2_200);
    return () => clearInterval(id);
  }, [agentNames.join(',')]);

  if (logs.length === 0) return (
    <div className="text-[12px] text-slate-700 py-6 text-center">
      Deploy an agent to see live activity…
    </div>
  );

  return (
    <div className="space-y-0 overflow-hidden">
      {logs.map((log, i) => (
        <div
          key={log.id}
          className={`flex items-center gap-3 py-2 px-3 rounded-lg text-[11px] font-mono transition-opacity duration-700
            ${i === 0 ? 'bg-white/[0.03] opacity-100' : 'opacity-70'}`}
        >
          <span className="text-slate-600 w-16 flex-shrink-0">{log.ts}</span>
          <span className="text-red-400/80 w-24 flex-shrink-0 truncate">{log.agent}</span>
          <span className="text-slate-400 w-16 flex-shrink-0">{log.action}</span>
          <span className="text-slate-600 flex-1 truncate">{log.target}</span>
          <span className="text-slate-300 w-20 text-right flex-shrink-0">{log.amount}</span>
          <span className={`w-16 text-right flex-shrink-0 ${
            log.status === 'confirmed' ? 'text-emerald-500' :
            log.status === 'pending'   ? 'text-amber-500'   : 'text-red-500'
          }`}>
            {log.status === 'confirmed' ? '✓ done' :
             log.status === 'pending'   ? '⏳ wait'  : '✗ fail'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Deploy modal ───────────────────────────────────────────────────────────────

function DeployModal({ onClose }: { onClose: () => void }) {
  const create = useCreateAgent();
  const [name, setName]   = useState('');
  const [desc, setDesc]   = useState('');
  const [ver,  setVer]    = useState('1.0.0');

  const submit = () => {
    if (!name.trim()) return;
    create.mutate({ name: name.trim(), description: desc.trim() || undefined, version: ver.trim() || '1.0.0' },
      { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141720] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Bot size={16} className="text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">Deploy New Agent</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Agent name *</label>
            <input
              autoFocus
              placeholder="e.g. Treasury Bot Alpha"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/60"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Description</label>
            <textarea
              placeholder="What does this agent do?"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={2}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/60 resize-none"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Version</label>
            <input
              placeholder="1.0.0"
              value={ver}
              onChange={e => setVer(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500/60"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || create.isPending}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <Zap size={13} />
            {create.isPending ? 'Deploying…' : 'Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── AgentsPage ─────────────────────────────────────────────────────────────────

export function AgentsPage() {
  const { data: agents = [], isLoading } = useAgents();
  const [modal, setModal] = useState(false);

  const activeAgents = agents.filter(a => a.isActive);
  const agentNames   = useMemo(() => activeAgents.map(a => a.name), [activeAgents.length]);

  return (
    <div className="flex flex-col h-full min-h-screen">

      {/* ── Animated hero ── */}
      <div className="relative overflow-hidden bg-[#0d0f15] border-b border-white/[0.05]" style={{ height: 140 }}>
        <NeuralCanvas />
        <div className="absolute inset-0 flex items-end px-8 pb-6 gap-8 pointer-events-none">
          <div>
            <p className="text-[11px] font-mono text-red-400/70 uppercase tracking-widest mb-0.5">Active</p>
            <p className="text-3xl font-bold text-white tabular-nums">{activeAgents.length}</p>
          </div>
          <div>
            <p className="text-[11px] font-mono text-slate-600 uppercase tracking-widest mb-0.5">Total</p>
            <p className="text-3xl font-bold text-slate-400 tabular-nums">{agents.length}</p>
          </div>
          <div className="flex-1" />
          <div className="pointer-events-auto">
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[13px] font-medium transition-colors shadow-lg shadow-red-900/30"
            >
              <Plus size={14} />
              Deploy Agent
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 p-8 grid grid-cols-[1fr_320px] gap-6 min-h-0">

        {/* Left: agent cards */}
        <div>
          <h2 className="text-[11px] font-mono text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bot size={11} />
            Deployed agents
          </h2>

          {isLoading ? (
            <div className="text-slate-600 text-sm">Loading…</div>
          ) : agents.length === 0 ? (
            <div className="border border-dashed border-white/[0.06] rounded-2xl p-10 text-center">
              <Bot size={28} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">No agents deployed yet.</p>
              <button
                onClick={() => setModal(true)}
                className="mt-3 text-red-500 hover:text-red-400 text-[13px] transition-colors"
              >
                Deploy your first agent →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {agents.map(a => <AgentCard key={a.id} agent={a} />)}
            </div>
          )}
        </div>

        {/* Right: live feed */}
        <div className="bg-[#0d0f15] rounded-2xl border border-white/[0.05] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05]">
            <Activity size={11} className="text-red-400" />
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest">Live Activity</span>
            {activeAgents.length > 0 && (
              <span className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                live
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-1 py-2" style={{ maxHeight: 500 }}>
            <LiveFeed agentNames={agentNames} />
          </div>
        </div>
      </div>

      {modal && <DeployModal onClose={() => setModal(false)} />}
    </div>
  );
}
