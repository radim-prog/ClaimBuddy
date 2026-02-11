import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-bold text-purple-600 mb-4">404</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Stránka nenalezena
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tato stránka neexistuje nebo byla přesunuta.
        </p>
        <Link
          href="/accountant/dashboard"
          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Zpět na Dashboard
        </Link>
      </div>
    </div>
  )
}
