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

      <h2 className="section-title">Comportamento</h2>
      <section>
        <label className="setting-row">
          <span>
            Velocità di camminata
            <small>Quanto va veloce quando si muove</small>
          </span>
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
          <span>
            Livello di attività
            <small>Quanto spesso si alza a fare un giro</small>
          </span>
          <select
            value={settings.activityLevel}
            onChange={(e) =>
              update({ activityLevel: e.target.value as AppSettings["activityLevel"] })
            }
          >
            <option value="lazy">Pigro</option>
            <option value="normal">Normale</option>
            <option value="hyper">Iperattivo</option>
          </select>
        </label>

        <label className="setting-row checkbox-row">
          <span>
            Sonnellino quando è fermo
            <small>Dopo un po' di inattività si addormenta</small>
          </span>
          <input
            type="checkbox"
            checked={settings.napEnabled}
            onChange={(e) => update({ napEnabled: e.target.checked })}
          />
        </label>
      </section>

      <h2 className="section-title">Aspetto</h2>
      <section>
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

        <label className="setting-row">
          <span>
            Opacità
            <small>Più bassa, più si intravede cosa c'è sotto</small>
          </span>
          <select
            value={String(settings.opacityPercent)}
            onChange={(e) => update({ opacityPercent: Number(e.target.value) })}
          >
            <option value="100">100%</option>
            <option value="80">80%</option>
            <option value="60">60%</option>
            <option value="40">40%</option>
          </select>
        </label>

        <label className="setting-row checkbox-row">
          <span>Ombra sotto il pet</span>
          <input
            type="checkbox"
            checked={settings.shadowEnabled}
            onChange={(e) => update({ shadowEnabled: e.target.checked })}
          />
        </label>
      </section>

      <h2 className="section-title">Suoni</h2>
      <section>
        <label className="setting-row checkbox-row">
          <span>Suoni quando lo coccoli</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => update({ soundEnabled: e.target.checked })}
          />
        </label>

        <label className={`setting-row ${settings.soundEnabled ? "" : "disabled"}`}>
          <span>Volume</span>
          <select
            value={settings.soundVolume}
            disabled={!settings.soundEnabled}
            onChange={(e) =>
              update({ soundVolume: e.target.value as AppSettings["soundVolume"] })
            }
          >
            <option value="soft">Sussurro</option>
            <option value="normal">Normale</option>
            <option value="loud">Squillante</option>
          </select>
        </label>
      </section>

      <h2 className="section-title">Sistema</h2>
      <section>
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
