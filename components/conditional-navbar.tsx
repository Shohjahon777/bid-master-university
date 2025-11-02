'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './navbar'
import { Footer } from './footer'

export function ConditionalNavbar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')
  
  if (isDashboard) {
    // Dashboard has its own layout, don't render navbar/footer
    return <div className="flex flex-col flex-1">{children}</div>
  }
  
  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

