export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50" style={{ background: "#f8fafc", color: "#1e293b" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {children}
      </div>
    </div>
  );
}
