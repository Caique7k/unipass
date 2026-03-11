export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center gap-6">
        <img src="/logo_unipass.png" className="w-12 animate-pulse" />

        <div className="flex gap-2">
          <div className="w-2 h-2 bg-[#ff5c00] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[#ff5c00] rounded-full animate-bounce [animation-delay:.15s]"></div>
          <div className="w-2 h-2 bg-[#ff5c00] rounded-full animate-bounce [animation-delay:.3s]"></div>
        </div>
      </div>
    </div>
  );
}
