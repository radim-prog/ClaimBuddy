# Jak exportovat dokumenty do PDF

**Účel:** Převést Markdown dokumenty na profesionální PDF pro:
- Publikaci na webu (ke stažení)
- Tisk a podpis
- Archivaci

---

## Metoda 1: Pandoc (doporučeno pro kvalitu)

### Instalace
```bash
# macOS
brew install pandoc
brew install basictex  # LaTeX (pro PDF)

# Nebo použít MacTeX (větší, ale kompletní)
brew install --cask mactex
```

### Export jednoho souboru
```bash
cd <project-root>/legal/

# Základní PDF
pandoc TERMS_AND_CONDITIONS.md -o TERMS_AND_CONDITIONS.pdf

# S českou typografií a stylem
pandoc TERMS_AND_CONDITIONS.md \
  -o TERMS_AND_CONDITIONS.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2cm \
  -V mainfont="Arial" \
  -V fontsize=11pt \
  -V documentclass=article \
  -V lang=cs
```

### Export všech souborů najednou
```bash
for file in *.md; do
  if [ "$file" != "README.md" ] && [ "$file" != "HOW_TO_EXPORT_PDF.md" ]; then
    pandoc "$file" \
      -o "${file%.md}.pdf" \
      --pdf-engine=xelatex \
      -V geometry:margin=2.5cm \
      -V mainfont="Arial" \
      -V fontsize=11pt \
      -V lang=cs
    echo "Exported: $file → ${file%.md}.pdf"
  fi
done
```

### S vlastním CSS stylem
```bash
# Vytvořit custom.css
cat > custom.css << 'EOF'
body {
  font-family: Arial, sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 2cm;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

h2 {
  color: #34495e;
  margin-top: 30px;
}

.disclaimer {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
  padding: 10px;
  margin: 20px 0;
}
EOF

# Export s CSS
pandoc TERMS_AND_CONDITIONS.md \
  -o TERMS_AND_CONDITIONS.pdf \
  --css=custom.css
```

---

## Metoda 2: Puppeteer (doporučeno pro web-ready PDF)

### Instalace
```bash
npm install -g puppeteer markdown-it
```

### Node.js script
```javascript
// generate-pdf.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const MarkdownIt = require('markdown-it');

const md = new MarkdownIt();

async function convertToPDF(mdFile, pdfFile) {
  const markdown = fs.readFileSync(mdFile, 'utf8');
  const html = md.render(markdown);

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 2cm;
        }
        h1 {
          color: #2c3e50;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        h2 {
          color: #34495e;
          margin-top: 30px;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 20px 0;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 10px;
          text-align: left;
        }
        th {
          background: #f5f5f5;
        }
        code {
          background: #f5f5f5;
          padding: 2px 5px;
          border-radius: 3px;
        }
        .disclaimer {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      ${html}
      <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 9pt; color: #666;">
        <p>Pojistná Pomoc s.r.o. | IČO: [doplnit] | www.pu.zajcon.cz</p>
        <p>Vytištěno: ${new Date().toLocaleDateString('cs-CZ')}</p>
      </footer>
    </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  await page.pdf({
    path: pdfFile,
    format: 'A4',
    margin: {
      top: '2cm',
      right: '2cm',
      bottom: '2cm',
      left: '2cm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 9pt; text-align: center; width: 100%; color: #666;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `
  });

  await browser.close();
  console.log(`✅ PDF vytvořeno: ${pdfFile}`);
}

// Export všech dokumentů
const files = [
  'TERMS_AND_CONDITIONS',
  'PRIVACY_POLICY',
  'GDPR_CONSENT_FORM',
  'CLIENT_CONTRACT_TEMPLATE',
  'COMPLAINTS_POLICY',
  'COOKIE_POLICY',
  'WEBSITE_DISCLAIMER',
  'COMPLIANCE_CHECKLIST'
];

(async () => {
  for (const file of files) {
    await convertToPDF(`${file}.md`, `${file}.pdf`);
  }
  console.log('✅ Všechny PDF vytvořeny!');
})();
```

### Spuštění
```bash
cd <project-root>/legal/
node generate-pdf.js
```

---

## Metoda 3: VS Code extension (nejjednodušší)

### Instalace
1. Otevřít VS Code
2. Extensions (Cmd+Shift+X)
3. Hledat: "Markdown PDF"
4. Instalovat "yzane.markdown-pdf"

### Export
1. Otevřít `.md` soubor
2. Cmd+Shift+P → "Markdown PDF: Export (pdf)"
3. PDF se vytvoří ve stejné složce

### Nastavení (settings.json)
```json
{
  "markdown-pdf.format": "A4",
  "markdown-pdf.displayHeaderFooter": true,
  "markdown-pdf.headerTemplate": "<div></div>",
  "markdown-pdf.footerTemplate": "<div style='font-size:9pt; text-align:center; width:100%;'><span class='pageNumber'></span> / <span class='totalPages'></span></div>",
  "markdown-pdf.margin.top": "2cm",
  "markdown-pdf.margin.bottom": "2cm",
  "markdown-pdf.margin.left": "2cm",
  "markdown-pdf.margin.right": "2cm",
  "markdown-pdf.styles": [
    "<project-root>/legal/custom.css"
  ]
}
```

---

## Metoda 4: Online nástroje (bez instalace)

### Markdown to PDF Online
- [markdown-pdf.com](https://markdown-pdf.com) - zdarma
- [cloudconvert.com](https://cloudconvert.com/md-to-pdf) - 25 konverzí/den zdarma
- [dillinger.io](https://dillinger.io) - online Markdown editor s export

**Postup:**
1. Otevřít soubor `.md` v textovém editoru
2. Zkopírovat obsah (Cmd+A, Cmd+C)
3. Vložit na web
4. Export → PDF
5. Stáhnout

**Nevýhoda:** Manuální, časově náročné pro 8 souborů.

---

## Metoda 5: Google Docs (pro spolupráci)

### Postup
1. Nahrát `.md` soubory na Google Drive
2. Otevřít v Google Docs (Otevřít s → Google Docs)
3. Formátování → Styly (nadpisy, odstavce)
4. Soubor → Stáhnout → PDF

**Výhoda:** Snadná kolaborace s advokátem (komentáře, track changes)
**Nevýhoda:** Ztrácí některé Markdown prvky (code blocks, tabulky).

---

## Doporučený workflow

### Pro webovou publikaci:
```bash
# 1. Pandoc export (nejlepší kvalita)
pandoc TERMS_AND_CONDITIONS.md \
  -o public/documents/obchodni-podminky.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=2.5cm \
  -V mainfont="Arial" \
  -V fontsize=11pt \
  -V lang=cs

# 2. Nahrát na server
# www.pu.zajcon.cz/documents/obchodni-podminky.pdf
```

### Pro tisk a podpis:
```bash
# Puppeteer (web-ready s CSS)
node generate-pdf.js
```

### Pro právní review:
```bash
# Google Docs (komentáře a track changes)
# Nebo Pandoc → DOCX (Word)
pandoc TERMS_AND_CONDITIONS.md -o TERMS_AND_CONDITIONS.docx
```

---

## Poznámky

### Watermark (pro draft verze)
```javascript
// V Puppeteer scriptu přidat:
const watermark = `
  <div style="
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 80pt;
    color: rgba(255, 0, 0, 0.1);
    z-index: -1;
    pointer-events: none;
  ">
    DRAFT
  </div>
`;
// Přidat do fullHtml před </body>
```

### Elektronický podpis
Po exportu do PDF:
1. Nahrát na DocuSign, Signi.com, Adobe Sign
2. Přidat pole pro podpis
3. Zaslat klientovi k podpisu
4. Stáhnout podepsaný PDF
5. Archivovat šifrovaně

---

**Tip:** Pro automatizaci při každé změně dokumentu:
```bash
# Git hook (při commitu)
# .git/hooks/pre-commit
#!/bin/bash
for file in *.md; do
  pandoc "$file" -o "pdf/${file%.md}.pdf"
done
git add pdf/*.pdf
```

---

**Vytvořeno:** 1. listopadu 2025
**Autor:** Claude Code
