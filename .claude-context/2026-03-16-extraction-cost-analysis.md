# Analýza nákladů: AI extrakce dokladů
**Datum:** 2026-03-16
**Kategorie:** business, monetizace
**Kurzy:** 1 USD = 23 Kč, 1 EUR = 25 Kč

---

## 1. OCR náklady (per stránka/dokument)

| Služba | Cena USD | Cena Kč | Poznámka |
|--------|---------|---------|---------|
| **GLM-OCR (ocr.z.ai)** | $0.03 / 1M tokenů | **~0.001 Kč** | Aktuálně používáme — de facto zdarma |
| Tesseract | $0 | 0 Kč | Self-hosted, zdarma, horší na složitých layoutech |
| Google Cloud Vision | $0.0015/str | ~0.035 Kč | Free: 1 000 str/měs |
| Azure Doc Intelligence (Read) | $0.0015/str | ~0.035 Kč | Free: 500 str/měs |
| Azure Doc Intelligence (prebuilt-invoice) | $0.010/str | ~0.23 Kč | All-in-one incl. extrakce |
| AWS Textract (text) | $0.0015/str | ~0.035 Kč | Free: 1 000 str/měs |
| AWS Textract (forms) | $0.050/str | ~1.15 Kč | Formuláře + tabulky |

**GLM-OCR výpočet:**
Česká faktura A4 = ~1 000 OCR tokenů × $0.000000030 = $0.000030 = **0.0007 Kč/dokument**

---

## 2. LLM extrakce — typický token count pro českou fakturu

| Komponenta | Znaky | Tokeny |
|------------|-------|--------|
| OCR výstup (faktura A4, střední hustota) | ~2 000–4 000 | ~500–1 000 |
| System prompt (instrukce + JSON schema) | ~2 000–3 200 | ~500–800 |
| **Celkový input** | | **~1 500 tokenů** |
| JSON výstup (IČO, DIČ, VS, DPH, celkem, dodavatel, datum...) | ~600–1 200 | **~250 tokenů** |

**Standardní faktura: 1 500 input + 250 output tokenů**

### LLM ceny a náklady per dokument

| Model | Input /1M | Output /1M | Kč/dokument |
|-------|-----------|-----------|-------------|
| **Gemini 2.0 Flash Lite** | $0.075 | $0.30 | **~0.004 Kč** |
| **Gemini 2.0 Flash** | $0.10 | $0.40 | **~0.006 Kč** |
| **GPT-4o-mini** | $0.15 | $0.60 | **~0.009 Kč** |
| **Claude Haiku 4.5** | $1.00 | $5.00 | **~0.063 Kč** |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | **~0.191 Kč** |

---

## 3. Celkové náklady: OCR + LLM extrakce

| Kombinace | OCR | LLM | **Celkem Kč** |
|-----------|-----|-----|--------------|
| GLM-OCR + Gemini Flash Lite | ~0.001 | ~0.004 | **~0.005 Kč** |
| GLM-OCR + GPT-4o-mini | ~0.001 | ~0.009 | **~0.010 Kč** |
| GLM-OCR + Claude Haiku | ~0.001 | ~0.063 | **~0.064 Kč** |
| GLM-OCR + Claude Sonnet 4.6 | ~0.001 | ~0.191 | **~0.192 Kč** |
| Google Vision + GPT-4o-mini | ~0.035 | ~0.009 | **~0.044 Kč** |
| Azure prebuilt-invoice | ~0.23 | 0 (zahrnut) | **~0.230 Kč** |
| AWS Textract forms | ~1.15 | 0 (zahrnut) | **~1.150 Kč** |

**Aktuální stack (GLM-OCR + GPT-4o-mini nebo Claude Haiku):** ~0.01–0.07 Kč/dokument

---

## 4. Náklady při verifikaci (3. průchod LLM)

U vytěžování s verifikací (OCR → extrakce → verifikace = 3 LLM volání):

| Stack | OCR | Extrakce | Verifikace | **Celkem Kč** |
|-------|-----|---------|-----------|--------------|
| GLM-OCR + GPT-4o-mini (×2) | ~0.001 | ~0.009 | ~0.009 | **~0.019 Kč** |
| GLM-OCR + Haiku extrakce + Sonnet verifikace | ~0.001 | ~0.063 | ~0.192 | **~0.256 Kč** |

---

## 5. Konkurenční ceny

| Produkt | Cena | Kč/dokument | Model |
|---------|------|-------------|-------|
| **Fakturoid (Robot Box)** | 500 Kč / 100 dok | **5 Kč** | Paušál, Digitoo pod kapotou |
| **Mindee Invoice API** | $0.01–$0.10/str | **0.23–2.3 Kč** | Pay-as-you-go, první 250/měs zdarma |
| **Veryfi** | $500/měs → 3 125 dok | **~3.7 Kč** | Min. $500/měs, $0.16/dok |
| **Rossum.ai** | ~$0.50/dok (min) | **~11.5 Kč** | Enterprise, $18k/rok minimum |
| **Azure prebuilt-invoice** | $0.010/str | **~0.23 Kč** | API, bez marže |
| **ABBYY FlexiCapture** | custom quote | neuvedeno | Enterprise on-premise |
| **iDoklad** | Rossum AI (cena neveřejná) | ~5–15 Kč est. | B2B |

---

## 6. Závěr a doporučení pro ceník UcetniWebApp

### Skutečné náklady
- **Nejlevnější reálný stack:** GLM-OCR + GPT-4o-mini = **~0.01 Kč/dokument**
- **Aktuální stack (Haiku nebo GPT-4o-mini):** **~0.01–0.07 Kč/dokument**
- **S verifikací:** **~0.02–0.26 Kč/dokument**

### Srovnání s konkurencí
- Fakturoid účtuje 5 Kč/dok — jejich skutečné náklady jsou ~0.05–0.10 Kč → **marže 98–99%**
- Mindee od 0.23 Kč — stále 3–23× dražší než vlastní stack

### Doporučené ceny pro credit packs (aktuální: 9 Kč/dok, viz BOD-131)
| Varianta | Cena/dok | Marže nad náklady | Vs. Fakturoid |
|----------|---------|------------------|--------------|
| Credit basic (GPT-4o-mini) | **1–2 Kč** | 99% | 2.5–5× levnější |
| Credit standard | **3–4 Kč** | 99% | Srovnatelné s Veryfi |
| Credit premium (Sonnet) | **9 Kč** | 98% | Stejné jako Fakturoid |

**Závěr:** Cena 9 Kč/doklad (BOD-131) je konzervativní a férová. Existuje prostor pro levnější tier
(1–2 Kč s GPT-4o-mini) nebo agresivnější cenu vs. Fakturoid.

---

## Zdroje
- [Z.AI GLM-OCR docs](https://docs.z.ai/guides/vlm/glm-ocr)
- [Z.AI pricing — pricepertoken.com](https://pricepertoken.com/pricing-page/provider/z-ai)
- [OpenAI pricing](https://openai.com/api/pricing/)
- [Anthropic pricing — invertedstone.com](https://invertedstone.com/calculators/claude-pricing)
- [Gemini pricing — ai.google.dev](https://ai.google.dev/gemini-api/docs/pricing)
- [Mindee pricing](https://www.mindee.com/pricing)
- [Veryfi pricing](https://www.veryfi.com/pricing/)
- [Rossum pricing](https://rossum.ai/pricing/)
- [Fakturoid ceník](https://www.fakturoid.cz/cenik)
- [Azure Document Intelligence pricing](https://azure.microsoft.com/en-us/pricing/details/document-intelligence/)
