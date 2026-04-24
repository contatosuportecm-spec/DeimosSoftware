import LayoutApp from "@/app/layout-app";

export default function SettingsPage() {
  return (
    <LayoutApp>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Configurações</h1>
          <p className="text-sm text-text-secondary mt-1">Gerencie as configurações do sistema</p>
        </div>

        <div className="rounded-lg border border-border bg-bg-2 p-8 flex items-center justify-center">
          <p className="text-text-muted text-sm">Em desenvolvimento</p>
        </div>
      </div>
    </LayoutApp>
  );
}
