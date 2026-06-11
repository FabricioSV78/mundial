export default function Loading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-14 place-items-center rounded-full border border-amber-300/35 bg-white/6">
          <span className="size-6 animate-spin rounded-full border-2 border-amber-300 border-t-transparent" />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-black text-white">Cargando pantalla...</p>
          <p className="text-sm font-medium text-white/60">Preparando la siguiente seccion.</p>
        </div>
      </div>
    </main>
  );
}
