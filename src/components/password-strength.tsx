'use client'

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (password.length === 0) return null

  const checks = [
    { label: 'V\u00e4hint\u00e4\u00e4n 8 merkki\u00e4', pass: password.length >= 8 },
    { label: 'Iso kirjain', pass: /[A-Z]/.test(password) },
    { label: 'Numero', pass: /[0-9]/.test(password) },
  ]

  return (
    <div className="space-y-1 text-xs">
      {checks.map((c) => (
        <p key={c.label} className={c.pass ? 'text-green-600' : 'text-muted-foreground'}>
          {c.pass ? '\u2713' : '\u25CB'} {c.label}
        </p>
      ))}
    </div>
  )
}

/** Returns true if the password meets all requirements */
export function isPasswordValid(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
}
