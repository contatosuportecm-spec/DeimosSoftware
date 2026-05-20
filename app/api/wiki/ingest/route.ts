import { NextRequest, NextResponse } from 'next/server'
import { ingestSource } from '@/lib/wiki/ingest'
import { extractPdfText } from '@/lib/pdf'
import type { RawSourceKind } from '@/types/knowledge'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? ''

    let kind: RawSourceKind = 'manual'
    let title = ''
    let author: string | undefined
    let niche: string | undefined
    let content = ''
    let source_url: string | undefined
    let file_url: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      title = formData.get('title') as string || 'Documento sem titulo'
      author = (formData.get('author') as string) || undefined
      niche = (formData.get('niche') as string) || undefined
      kind = (formData.get('kind') as RawSourceKind) || 'manual'
      source_url = (formData.get('source_url') as string) || undefined

      const file = formData.get('file') as File | null

      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase()

        if (ext === 'pdf') {
          const buffer = Buffer.from(await file.arrayBuffer())
          content = await extractPdfText(buffer)
          kind = 'book'
        } else if (ext === 'md' || ext === 'txt') {
          content = await file.text()
        } else {
          return NextResponse.json({ error: 'Formato nao suportado. Use PDF, MD ou TXT.' }, { status: 400 })
        }

        if (!title || title === 'Documento sem titulo') {
          title = file.name.replace(/\.[^.]+$/, '')
        }
      } else {
        content = (formData.get('content') as string) || ''
      }
    } else {
      const body = await req.json()
      title = body.title || 'Documento sem titulo'
      author = body.author
      niche = body.niche
      kind = body.kind || 'manual'
      content = body.content || ''
      source_url = body.source_url
      file_url = body.file_url
    }

    if (!content || content.length < 50) {
      return NextResponse.json({ error: 'Conteudo muito curto (minimo 50 caracteres)' }, { status: 400 })
    }

    const result = await ingestSource({ kind, title, author, niche, content, source_url, file_url })

    return NextResponse.json(result, { status: 201 })
  } catch (err) {
    console.error('[wiki/ingest]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
