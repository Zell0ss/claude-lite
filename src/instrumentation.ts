export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runMigrations } = await import('@/lib/db')
    try {
      runMigrations()
    } catch (err) {
      console.error('[instrumentation] DB migration failed:', err)
      throw err
    }
  }
}
