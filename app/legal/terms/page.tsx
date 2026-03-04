import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { promises as fs } from 'fs';
import path from 'path';

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), 'legal', 'TERMS_AND_CONDITIONS.md');
  const content = await fs.readFile(filePath, 'utf8');

  return (
    <div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export const metadata = {
  title: 'Obchodní podmínky | Pojistná Pomoc',
  description: 'Obchodní podmínky používání služby Pojistná Pomoc',
};
