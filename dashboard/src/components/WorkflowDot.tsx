export default function WorkflowDot({ done }: { done: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        done
          ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
          : "border border-[#475569]"
      }`}
    />
  );
}
