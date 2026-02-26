'use client'

import {
  Crown,
  TrendingUp,
  ShieldCheck,
  Star,
  Percent,
  Package,
  Megaphone,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ProUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Ilmoitukset nostetaan feediss\u00e4',
    description: 'Pro-ilmoituksesi n\u00e4kyv\u00e4t aina ensimm\u00e4isin\u00e4',
  },
  {
    icon: Crown,
    title: '5 tarjous-ilmoitusta',
    description: 'Ilmaisk\u00e4ytt\u00e4jill\u00e4 vain 3',
  },
  {
    icon: ShieldCheck,
    title: 'Vahvistettu taitaja -badge',
    description: 'Erotut luotettavana k\u00e4ytt\u00e4j\u00e4n\u00e4',
  },
  {
    icon: Star,
    title: 'Prioriteettin\u00e4kyvyys',
    description: 'Ilmoituksesi saavat enemm\u00e4n huomiota',
  },
  {
    icon: Percent,
    title: 'Pienempi lainausprovisio',
    description: 'Vain 5% vs. normaali 10%',
  },
  {
    icon: Package,
    title: 'Rajaton lainaus',
    description: 'Ilmaisk\u00e4ytt\u00e4jill\u00e4 max 3 lainaus-ilmoitusta',
  },
  {
    icon: Megaphone,
    title: 'Mainosale',
    description: 'Mainokset 2,39 \u20ac/pv vs. normaali 2,99 \u20ac/pv',
  },
] as const

export function ProUpgradeModal({ open, onOpenChange }: ProUpgradeModalProps) {
  function handleUpgrade() {
    toast.info('Pro-tilaus tulossa pian!')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-h-[90dvh] overflow-y-auto">
        {/* Gold gradient header */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 px-6 pt-8 pb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              TackBird Pro
            </DialogTitle>
            <DialogDescription className="text-amber-50 text-sm mt-1">
              Saat parhaan hy\u00f6dyn naapuriavusta
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Benefits list */}
        <div className="px-6 py-4 space-y-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <benefit.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">{benefit.title}</p>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Price & CTA */}
        <div className="px-6 pb-6 space-y-3">
          <div className="text-center">
            <span className="text-2xl font-bold">4,99 \u20ac</span>
            <span className="text-muted-foreground text-sm">/kk</span>
          </div>

          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold h-11"
          >
            <Crown className="h-4 w-4 mr-1" />
            P\u00e4ivit\u00e4 Pro:ksi
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Voit peruuttaa milloin tahansa
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
