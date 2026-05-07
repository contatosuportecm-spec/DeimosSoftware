import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen depth-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">{children}</main>
    </div>
  );
}
