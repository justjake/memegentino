export function env(name: string): string {
  const result = process.env[name]
  if (typeof result === "string") {
    return result
  }

  throw new Error(`process.env.${name} undefined`)
}
