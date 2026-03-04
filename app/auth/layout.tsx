export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[15%] w-[50%] h-[60%] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[40%] h-[50%] rounded-full bg-accent/[0.04] blur-3xl" />
      </div>
      <div className="flex min-h-screen items-center justify-center p-4 relative">
        {children}
      </div>
    </div>
  )
}
