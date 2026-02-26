import { Header } from '@/components/header'
import { TabBar } from '@/components/tab-bar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh">
      <Header />
      <main className="mx-auto max-w-md pb-20">{children}</main>
      <TabBar />
    </div>
  )
}
