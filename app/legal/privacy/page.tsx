import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { promises as fs } from 'fs';
import path from 'path';

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'legal', 'PRIVACY_POLICY.md');
  const content = await fs.readFile(filePath, 'utf8');

  return (
    <div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export const metadata = {
  title: 'Zásady ochrany osobních údajů | ClaimBuddy',
  description: 'Zásady ochrany osobních údajů služby ClaimBuddy',
};
