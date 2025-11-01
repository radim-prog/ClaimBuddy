'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Kritická chyba</h1>
          <p>Aplikace narazila na kritickou chybu. Prosím obnovte stránku.</p>
          <button onClick={reset}>Obnovit</button>
        </div>
      </body>
    </html>
  );
}
