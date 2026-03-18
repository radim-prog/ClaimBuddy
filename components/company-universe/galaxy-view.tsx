'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'

// ============ TYPES ============

export type CompanyNode = {
  id: string
  name: string
  ico: string
  company_type: 'person' | 'holding' | 'daughter' | 'standalone'
  dph_status: 'payer' | 'non_payer' | 'in_process'
  health_score: number | null
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export type OwnershipLink = {
  source: string
  target: string
  share_percentage: number
}

type SimNode = CompanyNode & d3.SimulationNodeDatum
type SimLink = d3.SimulationLinkDatum<SimNode> & { share_percentage: number }

type GalaxyViewProps = {
  companies: CompanyNode[]
  links: OwnershipLink[]
  onSelectCompany: (id: string) => void
  savedPositions?: Record<string, { x: number; y: number }>
  onPositionsChange?: (positions: Record<string, { x: number; y: number }>) => void
}

// ============ CONSTANTS ============

const TYPE_COLORS: Record<string, string> = {
  holding: '#A855F7',   // purple
  daughter: '#3B82F6',  // blue
  person: '#22C55E',    // green
  standalone: '#6B7280', // gray
}

const TYPE_SIZES: Record<string, number> = {
  holding: 22,
  daughter: 16,
  person: 14,
  standalone: 12,
}

const DPH_COLORS: Record<string, string> = {
  payer: '#10B981',
  non_payer: '#EF4444',
  in_process: '#F59E0B',
}

// ============ COMPONENT ============

export function GalaxyView({
  companies,
  links,
  onSelectCompany,
  savedPositions,
  onPositionsChange,
}: GalaxyViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<SimNode, SimLink> | null>(null)

  const getPositions = useCallback((): Record<string, { x: number; y: number }> => {
    const positions: Record<string, { x: number; y: number }> = {}
    if (simulationRef.current) {
      simulationRef.current.nodes().forEach((n) => {
        positions[n.id] = { x: n.x ?? 0, y: n.y ?? 0 }
      })
    }
    return positions
  }, [])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl || companies.length === 0) return

    // Clear previous
    d3.select(svgEl).selectAll('*').remove()

    const width = svgEl.clientWidth || 900
    const height = svgEl.clientHeight || 600

    // Prepare nodes with saved positions
    const nodes: SimNode[] = companies.map((c) => {
      const saved = savedPositions?.[c.id]
      return {
        ...c,
        x: saved?.x ?? width / 2 + (Math.random() - 0.5) * 200,
        y: saved?.y ?? height / 2 + (Math.random() - 0.5) * 200,
        fx: saved ? saved.x : undefined,
        fy: saved ? saved.y : undefined,
      }
    })

    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    // Filter links to valid nodes only
    const simLinks: SimLink[] = links
      .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target))
      .map((l) => ({
        source: l.source,
        target: l.target,
        share_percentage: l.share_percentage,
      }))

    // ---- SVG structure ----
    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)

    const g = svg.append('g')

    // Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoomBehavior)

    // Click on background → deselect
    svg.on('click', () => {
      // no-op, could be used for deselect
    })

    // Arrow marker
    const defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'galaxy-arrowhead')
      .attr('viewBox', '0 0 10 6')
      .attr('refX', 10)
      .attr('refY', 3)
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,0 L10,3 L0,6')
      .attr('fill', '#94A3B8')

    // Layers
    const linkGroup = g.append('g').attr('class', 'links')
    const linkLabelGroup = g.append('g').attr('class', 'link-labels')
    const nodeGroup = g.append('g').attr('class', 'nodes')

    // ---- Curved link path ----
    function curvedLinkPath(d: SimLink): string {
      const src = d.source as SimNode
      const tgt = d.target as SimNode
      const dx = (tgt.x ?? 0) - (src.x ?? 0)
      const dy = (tgt.y ?? 0) - (src.y ?? 0)
      const dr = Math.sqrt(dx * dx + dy * dy) * 1.5
      const targetR = TYPE_SIZES[tgt.company_type] || 12
      const dist = Math.sqrt(dx * dx + dy * dy)
      const ratio = dist > 0 ? (dist - targetR - 4) / dist : 1
      const endX = (src.x ?? 0) + dx * ratio
      const endY = (src.y ?? 0) + dy * ratio
      return `M${src.x},${src.y} A${dr},${dr} 0 0,1 ${endX},${endY}`
    }

    // ---- Links ----
    const linkPaths = linkGroup.selectAll<SVGPathElement, SimLink>('path')
      .data(simLinks)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', '#94A3B8')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.45)
      .attr('marker-end', 'url(#galaxy-arrowhead)')
      .attr('d', curvedLinkPath)

    // ---- Link labels (percentage pills) ----
    const linkLabelGs = linkLabelGroup.selectAll<SVGGElement, SimLink>('g')
      .data(simLinks)
      .enter()
      .append('g')

    linkLabelGs.append('rect')
      .attr('rx', 8)
      .attr('ry', 8)
      .attr('fill', '#1E293B')
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 0.5)

    linkLabelGs.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#F1F5F9')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text((d) => `${d.share_percentage}%`)

    function updateLinkLabels() {
      linkLabelGs.each(function (d) {
        const gEl = d3.select(this)
        const src = d.source as SimNode
        const tgt = d.target as SimNode
        const mx = ((src.x ?? 0) + (tgt.x ?? 0)) / 2
        const my = ((src.y ?? 0) + (tgt.y ?? 0)) / 2 - 6
        const textEl = gEl.select('text').node() as SVGTextElement
        if (!textEl) return
        const bbox = textEl.getBBox()
        const px = 6
        const py = 3
        gEl.select('rect')
          .attr('x', mx - bbox.width / 2 - px)
          .attr('y', my - bbox.height / 2 - py)
          .attr('width', bbox.width + px * 2)
          .attr('height', bbox.height + py * 2)
        gEl.select('text').attr('x', mx).attr('y', my)
      })
    }

    // ---- Nodes ----
    const nodeGs = nodeGroup.selectAll<SVGGElement, SimNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)

    // Drag behavior
    const dragBehavior = d3.drag<SVGGElement, SimNode>()
      .on('start', function () {
        d3.select(this).raise()
      })
      .on('drag', function (event, d) {
        d.x = event.x
        d.y = event.y
        d.fx = event.x
        d.fy = event.y
        d3.select(this).attr('transform', `translate(${d.x},${d.y})`)

        // Update connected links
        linkPaths.filter((l) => {
          const s = l.source as SimNode
          const t = l.target as SimNode
          return s.id === d.id || t.id === d.id
        }).attr('d', curvedLinkPath)

        // Update link labels for connected links
        linkLabelGs.each(function (l) {
          const s = l.source as SimNode
          const t = l.target as SimNode
          if (s.id === d.id || t.id === d.id) {
            const gEl = d3.select(this)
            const mx = ((s.x ?? 0) + (t.x ?? 0)) / 2
            const my = ((s.y ?? 0) + (t.y ?? 0)) / 2 - 6
            const textEl = gEl.select('text').node() as SVGTextElement
            if (!textEl) return
            const bbox = textEl.getBBox()
            const px = 6
            const py = 3
            gEl.select('rect')
              .attr('x', mx - bbox.width / 2 - px)
              .attr('y', my - bbox.height / 2 - py)
              .attr('width', bbox.width + px * 2)
              .attr('height', bbox.height + py * 2)
            gEl.select('text').attr('x', mx).attr('y', my)
          }
        })
      })
      .on('end', () => {
        onPositionsChange?.(getPositions())
      })

    nodeGs.call(dragBehavior)

    // Node circle
    nodeGs.append('circle')
      .attr('r', (d) => TYPE_SIZES[d.company_type] || 12)
      .attr('fill', (d) => TYPE_COLORS[d.company_type] || '#6366F1')
      .attr('stroke', (d) => {
        const c = d3.color(TYPE_COLORS[d.company_type] || '#6366F1')
        return c ? c.darker(0.3).toString() : '#4338CA'
      })
      .attr('stroke-width', 2)

    // DPH indicator dot (top-right of node)
    nodeGs.filter((d) => !!DPH_COLORS[d.dph_status])
      .append('circle')
      .attr('r', 5)
      .attr('cx', (d) => (TYPE_SIZES[d.company_type] || 12) * 0.7)
      .attr('cy', (d) => -(TYPE_SIZES[d.company_type] || 12) * 0.7)
      .attr('fill', (d) => DPH_COLORS[d.dph_status] || '#6B7280')
      .attr('stroke', '#0F172A')
      .attr('stroke-width', 1.5)

    // Health score ring (optional, behind main circle)
    nodeGs.filter((d) => d.health_score !== null && d.health_score !== undefined)
      .insert('circle', ':first-child')
      .attr('r', (d) => (TYPE_SIZES[d.company_type] || 12) + 4)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        const score = d.health_score ?? 0
        if (score >= 80) return '#22C55E'
        if (score >= 50) return '#F59E0B'
        return '#EF4444'
      })
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', (d) => {
        const r = (TYPE_SIZES[d.company_type] || 12) + 4
        const circumference = 2 * Math.PI * r
        const score = d.health_score ?? 0
        const filled = (score / 100) * circumference
        return `${filled} ${circumference - filled}`
      })
      .attr('transform', 'rotate(-90)')

    // Display name: strip s.r.o., truncate to 2 words
    function displayName(d: SimNode): string {
      return d.name
        .replace(/ s\.r\.o\./g, '')
        .replace(/, s\.r\.o\./g, '')
        .split(' ')
        .slice(0, 2)
        .join(' ')
    }

    // Label: name
    const labelOffset = (d: SimNode) => (TYPE_SIZES[d.company_type] || 12) + 10

    nodeGs.append('text')
      .attr('y', (d) => labelOffset(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#F1F5F9')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')
      .text((d) => displayName(d))

    // Label: ICO
    nodeGs.filter((d) => !!d.ico)
      .append('text')
      .attr('y', (d) => labelOffset(d) + 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94A3B8')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none')
      .text((d) => d.ico)

    // Label background card
    nodeGs.each(function (d) {
      const el = d3.select(this)
      const texts = el.selectAll<SVGTextElement, unknown>('text')
      if (texts.empty()) return

      let minX = Infinity
      let minY = Infinity
      let maxX = -Infinity
      let maxY = -Infinity

      texts.each(function () {
        const bbox = this.getBBox()
        minX = Math.min(minX, bbox.x)
        minY = Math.min(minY, bbox.y)
        maxX = Math.max(maxX, bbox.x + bbox.width)
        maxY = Math.max(maxY, bbox.y + bbox.height)
      })

      const pad = 6
      el.insert('rect', 'text')
        .attr('x', minX - pad)
        .attr('y', minY - pad / 2)
        .attr('width', maxX - minX + pad * 2)
        .attr('height', maxY - minY + pad)
        .attr('rx', 4)
        .attr('ry', 4)
        .attr('fill', 'rgba(15, 23, 42, 0.85)')
        .attr('stroke', 'rgba(255,255,255,0.08)')
        .attr('stroke-width', 0.5)
    })

    // Click handler
    nodeGs.on('click', (_event, d) => {
      onSelectCompany(d.id)
    })

    // Hover effects
    nodeGs
      .on('mouseover', function (_event, d) {
        const r = TYPE_SIZES[d.company_type] || 12
        const color = TYPE_COLORS[d.company_type] || '#6366F1'
        d3.select(this).select('circle:not([stroke-dasharray])')
          .transition()
          .duration(200)
          .attr('r', r + 3)
        d3.select(this)
          .style('filter', `drop-shadow(0 0 8px ${color})`)
      })
      .on('mouseout', function (_event, d) {
        const r = TYPE_SIZES[d.company_type] || 12
        d3.select(this).select('circle:not([stroke-dasharray])')
          .transition()
          .duration(200)
          .attr('r', r)
        d3.select(this)
          .style('filter', null)
      })

    // ---- Force simulation ----
    const simulation = d3.forceSimulation<SimNode>(nodes)
      .force('charge', d3.forceManyBody<SimNode>().strength(-300))
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(150)
        .strength(0.5)
      )
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('collision', d3.forceCollide<SimNode>()
        .radius((d) => (TYPE_SIZES[d.company_type] || 12) + 30)
      )
      .alpha(savedPositions ? 0.05 : 0.8)
      .alphaDecay(0.02)
      .on('tick', () => {
        nodeGs.attr('transform', (d) => `translate(${d.x},${d.y})`)
        linkPaths.attr('d', curvedLinkPath)
        updateLinkLabels()
      })
      .on('end', () => {
        onPositionsChange?.(getPositions())
      })

    simulationRef.current = simulation

    // Cleanup
    return () => {
      simulation.stop()
      simulationRef.current = null
    }
  }, [companies, links, savedPositions, onSelectCompany, onPositionsChange, getPositions])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full bg-slate-950 rounded-lg"
      style={{ minHeight: 500 }}
    />
  )
}
