import { useEffect, useState } from "react";
import type { AppSettings } from "../../shared/types";

export function SettingsApp(): JSX.Element | null {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.batuffolina.settings.get().then(setSettings);
  }, []);

  async function update(partial: Partial<AppSettings>): Promise<void> {
    setSettings((prev) => (prev ? { ...prev, ...partial } : prev));
    const updated = await window.batuffolina.settings.set(partial);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  if (!settings) return null;

  return (
    <div className="settings">
      <h1>Impostazioni</h1>

      <section>
        <label className="setting-row">
          <span>Velocità di camminata</span>
          <select
            value={settings.speed}
            onChange={(e) => update({ speed: e.target.value as AppSettings["speed"] })}
          >
            <option value="slow">Lenta</option>
            <option value="normal">Normale</option>
            <option value="fast">Vivace</option>
          </select>
        </label>

        <label className="setting-row">
          <span>Dimensione</span>
          <select
            value={settings.size}
            onChange={(e) => update({ size: e.target.value as AppSettings["size"] })}
          >
            <option value="small">Piccolo</option>
            <option value="normal">Normale</option>
            <option value="large">Grande</option>
          </select>
        </label>

        <label className="setting-row checkbox-row">
          <span>Suoni quando lo coccoli</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => update({ soundEnabled: e.target.checked })}
          />
        </label>

        <label className="setting-row checkbox-row">
          <span>Resta visibile sopra le app a schermo intero</span>
          <input
            type="checkbox"
            checked={settings.stayOnTopOfFullscreen}
            onChange={(e) => update({ stayOnTopOfFullscreen: e.target.checked })}
          />
        </label>

        <label className="setting-row checkbox-row">
          <span>Avvia automaticamente all'accensione</span>
          <input
            type="checkbox"
            checked={settings.launchAtLogin}
            onChange={(e) => update({ launchAtLogin: e.target.checked })}
          />
        </label>
      </section>

      <p className={`saved-hint ${saved ? "visible" : ""}`}>Salvato ✓</p>
    </div>
  );
}
