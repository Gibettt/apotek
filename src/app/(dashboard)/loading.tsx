export default function DashboardLoading() {
  return (
    <div className="grid min-h-[320px] place-items-center">
      <div className="grid place-items-center gap-3 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#e8f4ef] border-t-[#0f766e]" />
        <p className="text-sm font-black text-stone-600">Memuat halaman...</p>
      </div>
    </div>
  );
}
