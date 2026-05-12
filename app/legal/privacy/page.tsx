import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'legal', 'PRIVACY_POLICY.md')
  const content = await fs.readFile(filePath, 'utf8')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
          &larr; Zpět na hlavní stránku
        </Link>
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </article>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Zásady ochrany osobních údajů | Pojistná Pomoc',
  description: 'Zásady ochrany osobních údajů služby Pojistná Pomoc',
}
