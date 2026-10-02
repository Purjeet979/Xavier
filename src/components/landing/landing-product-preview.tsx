import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  MessageSquare,
  FileText,
  FolderKanban,
  Settings,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import bgSvg from '@/assets/bg.svg'

export function LandingProductPreview() {
  const [activeCitation, setActiveCitation] = useState<'C1' | 'C2'>('C1')

  return (
    <section
      id="preview"
      className="py-24 md:py-32 bg-[#14120d] text-[#ECE8DE] border-t border-b border-[#39352B] relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bgSvg})` }}
    >
      {/* Subtle warm amber illumination overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          background: 'radial-gradient(ellipse at center, #D4A64A, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header with Editorial Nighttime Library Atmosphere */}
        <div className="text-left max-w-3xl mb-14">
          <div className="text-xs font-mono font-semibold text-[#D4A64A] uppercase tracking-widest mb-2 flex items-center gap-2">
            <span>रात्रिस्वाध्याय</span>
            <span>•</span>
            <span>The Study Sanctuary</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-[#ECE8DE] tracking-tight leading-tight">
            Quiet. Rigorous. <br />
            <span className="font-serif italic font-normal text-[#D4A64A]">Completely Grounded</span>.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#AAA497] leading-relaxed">
            Step directly into the actual Gyansutra environment. No flashy marketing simulations—this is the real, distraction-free study workspace.
          </p>
        </div>

        {/* Believable Study Workflow: Material -> Question -> Answer -> Citation */}
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#39352B] bg-[#211F19] shadow-2xl overflow-hidden transition-all duration-200">
          {/* Top Window Chrome */}
          <div className="h-11 border-b border-[#39352B] bg-[#1A1813] px-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#E57373]/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#FFD54F]/80 inline-block" />
              <span className="h-3 w-3 rounded-full bg-[#81C784]/80 inline-block" />
              <span className="ml-3 font-mono text-xs text-[#AAA497] hidden sm:inline">
                Gyansutra StudyGround • CS 482: Machine Learning & NLP
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] text-[#AAA497] hidden sm:inline">PGlite Vector Cache Active</span>
            </div>
          </div>

          {/* Main Study Workspace Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
            {/* Left Study Material Library */}
            <div className="md:col-span-4 border-r border-[#39352B] bg-[#1C1A14] p-4 space-y-4 hidden md:flex md:flex-col justify-between">
              <div className="space-y-4">
                {/* Active Workspace Header */}
                <div className="p-3 rounded-xl border border-[#39352B] bg-[#25221B] flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-[#D4A64A] text-[#171612] flex items-center justify-center font-bold text-xs">
                    CS
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#ECE8DE] truncate">Natural Language Systems</div>
                    <div className="text-[10px] text-[#AAA497]">2 Verified Documents</div>
                  </div>
                </div>

                {/* Navigation Pills */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium bg-[#383224] text-[#D4A64A] border border-[#D4A64A]/30">
                    <MessageSquare className="h-4 w-4" />
                    <span>Inquiry Dialogue</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#AAA497] hover:bg-[#25221B] transition-colors">
                    <FolderKanban className="h-4 w-4" />
                    <span>Workspaces</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#AAA497] hover:bg-[#25221B] transition-colors">
                    <FileText className="h-4 w-4" />
                    <span>Indexed Documents</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#AAA497] hover:bg-[#25221B] transition-colors">
                    <Settings className="h-4 w-4" />
                    <span>Hardware Settings</span>
                  </div>
                </div>

                {/* Uploaded Material List */}
                <div className="pt-2 border-t border-[#39352B]">
                  <div className="text-[10px] font-semibold text-[#AAA497] uppercase tracking-wider px-2 mb-2 font-mono">
                    Active Curriculum Material
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#25221B] border border-[#39352B] hover:border-[#D4A64A]/40 transition-colors">
                      <div className="font-medium text-[#ECE8DE] truncate flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-[#D4A64A] shrink-0" />
                        Attention_Is_All_You_Need.pdf
                      </div>
                      <div className="text-[10px] text-[#AAA497] mt-1 font-mono">15 Pages • 42 Chunks Indexed</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#25221B] border border-[#39352B] hover:border-[#D4A64A]/40 transition-colors">
                      <div className="font-medium text-[#ECE8DE] truncate flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-[#D4A64A] shrink-0" />
                        Lecture_4_Transformer_Blocks.md
                      </div>
                      <div className="text-[10px] text-[#AAA497] mt-1 font-mono">6 Pages • 18 Chunks Indexed</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sovereign Client Indicator */}
              <div className="p-3 rounded-xl border border-[#39352B] bg-[#25221B] text-[11px] text-[#AAA497] space-y-1">
                <div className="flex items-center gap-1.5 text-[#D4A64A] font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Client Inference
                </div>
                <p className="text-[10px] leading-tight">
                  Running entirely on local WebGPU with zero telemetry.
                </p>
              </div>
            </div>

            {/* Right Chat & Grounded Knowledge Workspace */}
            <div className="md:col-span-8 flex flex-col justify-between p-4 sm:p-6 bg-[#211F19]">
              {/* Question & Answer Exchange */}
              <div className="space-y-4 max-w-2xl mx-auto w-full">
                {/* Student Question */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-3 bg-[#D4A64A] text-[#171612] text-xs sm:text-sm font-medium leading-relaxed shadow-sm">
                    How does multi-head attention prevent the model from averaging away important contextual positions?
                  </div>
                </div>

                {/* Assistant Grounded Response */}
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-xl bg-[#29261E] border border-[#39352B] flex items-center justify-center shrink-0 mt-1 text-[#D4A64A]">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div className="rounded-2xl rounded-tl-sm border border-[#39352B] bg-[#29261E] p-4 sm:p-5 text-xs sm:text-sm text-[#ECE8DE] space-y-2.5 leading-relaxed shadow-sm">
                      <p>
                        In single-head attention, averaging across representations inhibits the network from concurrently focusing on different linguistic aspects.
                      </p>
                      <p>
                        <strong>Multi-Head Attention</strong> solves this by projecting queries, keys, and values <span className="font-mono text-[#D4A64A]">h</span> times into lower-dimensional subspaces (<span className="font-mono text-xs">d_k = d_model / h</span>):
                      </p>
                      <div className="p-3 bg-[#1C1A14] rounded-xl font-mono text-[11px] sm:text-xs text-[#D4A64A] overflow-x-auto border border-[#39352B]">
                        MultiHead(Q, K, V) = Concat(head₁, ..., headₕ)Wᴼ
                      </div>
                      <p className="text-xs text-[#AAA497]">
                        Each head attends to distinct semantic roles (such as subject-verb agreement vs. long-range coreference) before the projections are concatenated.
                      </p>
                    </div>

                    {/* Verifiable Citation Chips */}
                    <div className="flex flex-col gap-1.5 pl-1">
                      <div className="text-[10px] font-semibold text-[#AAA497] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                        <Bookmark className="h-3 w-3 text-[#D4A64A]" /> Grounded In:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveCitation('C1')}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            activeCitation === 'C1'
                              ? 'bg-[#383224] text-[#D4A64A] border-[#D4A64A]/50 font-medium'
                              : 'bg-[#29261E] border-[#39352B] text-[#ECE8DE] hover:bg-[#353127]'
                          }`}
                        >
                          <span className="font-mono font-bold text-[#D4A64A] text-[10px]">[C1]</span>
                          <span className="truncate max-w-[150px]">Attention_Is_All_You_Need.pdf</span>
                          <span className="font-mono text-[#AAA497] text-[10px]">p.5</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveCitation('C2')}
                          className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            activeCitation === 'C2'
                              ? 'bg-[#383224] text-[#D4A64A] border-[#D4A64A]/50 font-medium'
                              : 'bg-[#29261E] border-[#39352B] text-[#ECE8DE] hover:bg-[#353127]'
                          }`}
                        >
                          <span className="font-mono font-bold text-[#D4A64A] text-[10px]">[C2]</span>
                          <span className="truncate max-w-[150px]">Lecture_4_Transformer_Blocks.md</span>
                          <span className="font-mono text-[#AAA497] text-[10px]">p.2</span>
                        </button>
                      </div>

                      {/* Interactive Verbatim Excerpt Drawer */}
                      <div className="mt-1 p-3 rounded-xl border border-[#D4A64A]/30 bg-[#25221B] text-xs text-[#ECE8DE] font-serif leading-relaxed">
                        <span className="font-mono text-[10px] uppercase tracking-wide font-bold text-[#D4A64A] block mb-0.5 font-sans">
                          Document Verbatim Chunk [{activeCitation}]:
                        </span>
                        {activeCitation === 'C1'
                          ? '"Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single attention head, averaging inhibits this."'
                          : '"Each attention head operates independently on d_k = d_model / h dimensions, yielding computational cost comparable to full-dimensional single-head attention."'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inquiry Prompt Composer */}
              <div className="mt-6 max-w-2xl mx-auto w-full pt-2">
                <div className="rounded-2xl border border-[#39352B] bg-[#29261E] p-2 flex items-center justify-between gap-3 shadow-xs">
                  <input
                    type="text"
                    readOnly
                    value="Compare positional encodings in Transformer vs Rotary Positional Embeddings (RoPE)..."
                    className="w-full bg-transparent px-3 text-xs text-[#AAA497] focus:outline-hidden"
                  />
                  <Link to="/">
                    <Button
                      size="sm"
                      className="rounded-xl bg-[#D4A64A] hover:bg-[#E0B65C] text-[#171612] text-xs font-semibold h-8 px-3 flex items-center gap-1 shrink-0"
                    >
                      <span>Study</span>
                      <Send className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-xs text-[#AAA497] font-mono">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#D4A64A]" /> Real-time in-browser citations
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#D4A64A]" /> Multiple subject workspaces
          </span>
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#D4A64A]" /> 100% private local execution
          </span>
        </div>
      </div>
    </section>
  )
}
