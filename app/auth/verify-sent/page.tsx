import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, MailCheck } from 'lucide-react'

export default function VerifySentPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-background dark:to-purple-950/20 relative overflow-hidden px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[60%] h-[80%] rounded-full bg-blue-400/[0.07] blur-3xl" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[50%] h-[60%] rounded-full bg-purple-300/[0.06] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back link */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět na přihlášení
        </Link>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" variant="purple" />
        </div>

        {/* Card */}
        <Card className="border-2 border-blue-200/60 dark:border-blue-800/40 shadow-soft-lg">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <MailCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground font-display mb-3">
                Ověřovací email odeslán
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed mb-2">
                Na váš email jsme odeslali odkaz pro ověření účtu.
                Zkontrolujte svou emailovou schránku a klikněte na odkaz pro dokončení registrace.
              </p>
              <p className="text-muted-foreground text-xs">
                Odkaz je platný 24 hodin. Pokud email nenajdete, zkontrolujte složku spam.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-blue-100 dark:border-blue-800/30">
              <p className="text-xs text-muted-foreground text-center">
                <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Přejít na přihlášení
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
