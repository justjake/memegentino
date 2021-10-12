export function env(name: string, fallback?: string): string {
  const result = process.env[name] || fallback
  if (typeof result === "string") {
    return result
  }

  throw new Error(`process.env.${name} undefined`)
}
