# Notion Mode Architecture

## Cíl
Rychlé spuštění služby bez vlastní DB infrastruktury.

## Datový tok
1. Klient vyplní formulář `/cases/new`
2. Frontend volá `POST /api/cases`
3. API validuje payload a zapisuje stránku do Notion DB

## Potřebná Notion DB pole
- `Name` (title)
- `CaseNumber` (rich_text)
- `FullName` (rich_text)
- `Email` (email)
- `Phone` (rich_text)
- `InsuranceType` (rich_text)
- `InsuranceCompany` (rich_text)
- `IncidentDate` (date)
- `IncidentLocation` (rich_text)
- `IncidentDescription` (rich_text)
- `ClaimAmount` (number)
- `Status` (select, hodnota `new`)
- `Source` (select, hodnota `website`)

## Omezení
- Bez uživatelských účtů
- Bez interního workflow v appce (řízení je v Notion)
- Upload dokumentů je dočasně vypnutý
