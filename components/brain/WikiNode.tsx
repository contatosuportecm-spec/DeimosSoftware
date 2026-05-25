"use client"

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { KIND_META, type WikiPageKind } from '@/types/knowledge'
import {
  PenTool, Cog, Layout, Repeat, Lightbulb, User, Shield, GraduationCap,
  DollarSign, Scale, Settings, Target, GitBranch, ClipboardList,
  FileText, Calendar, BarChart2, Bookmark, type LucideIcon,
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  'pen-tool': PenTool,
  'cog': Cog,
  'layout': Layout,
  'repeat': Repeat,
  'lightbulb': Lightbulb,
  'user': User,
  'shield': Shield,
  'graduation-cap': GraduationCap,
  'dollar-sign': DollarSign,
  'scale': Scale,
  'settings': Settings,
  'target': Target,
  'git-branch': GitBranch,
  'clipboard-list': ClipboardList,
  'file-text': FileText,
  'calendar': Calendar,
  'bar-chart-2': BarChart2,
  'bookmark': Bookmark,
}

interface WikiNodeData {
  title: string
  kind: WikiPageKind
  confidence: number
  usage_count: number
  selected?: boolean
}

function WikiNodeComponent({ data }: NodeProps<WikiNodeData>) {
  const meta = KIND_META[data.kind] ?? KIND_META.resource
  const Icon = ICON_MAP[meta.emoji] ?? Bookmark
  const size = Math.max(36, Math.min(56, 36 + (data.usage_count ?? 0) * 2))
  const opacity = 0.4 + (data.confidence ?? 0.5) * 0.6

  return (
    <div className="group relative flex flex-col items-center">
      <Handle type="target" position={Position.Top} className="!w-1.5 !h-1.5 !bg-white/20 !border-0 !-top-1" />

      <div
        className="flex items-center justify-center rounded-full border transition-all duration-200"
        style={{
          width: size,
          height: size,
          backgroundColor: `${meta.color}18`,
          borderColor: data.selected ? meta.color : `${meta.color}40`,
          borderWidth: data.selected ? 2 : 1,
          opacity,
          boxShadow: data.selected ? `0 0 20px ${meta.color}30` : 'none',
        }}
      >
        <Icon
          size={size * 0.4}
          strokeWidth={1.5}
          style={{ color: meta.color }}
        />
      </div>

      <span
        className="mt-1.5 text-[10px] leading-tight text-center max-w-[80px] truncate"
        style={{ color: data.selected ? '#fff' : '#A1A1AA' }}
      >
        {data.title}
      </span>

      {/* Tooltip on hover */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
        <div
          className="px-2 py-1 rounded text-[10px] whitespace-nowrap border"
          style={{
            backgroundColor: '#1C1C1F',
            borderColor: `${meta.color}40`,
            color: meta.color,
          }}
        >
          {meta.label}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-1.5 !h-1.5 !bg-white/20 !border-0 !-bottom-1" />
    </div>
  )
}

export default memo(WikiNodeComponent)
