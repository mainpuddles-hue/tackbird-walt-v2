import { Header } from '@/components/header'
import { TabBar } from '@/components/tab-bar'
import { ScrollToTop } from '@/components/scroll-to-top'
import { NetworkStatus } from '@/components/network-status'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-dvh">
      <Header />
      <NetworkStatus />
      <main className="mx-auto max-w-md pb-20">{children}</main>
      <TabBar />
      <ScrollToTop />
    </div>
  )
}
