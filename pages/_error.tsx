import type { NextPageContext } from 'next'

function Error({ statusCode }: { statusCode: number }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', height: '100vh', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 500 }}>
        {statusCode ? `Chyba ${statusCode}` : 'Nastala chyba'}
      </h1>
    </div>
  )
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404
  return { statusCode }
}

export default Error
