import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] depth-bg overflow-hidden animate-[fadeIn_600ms_ease-out]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
