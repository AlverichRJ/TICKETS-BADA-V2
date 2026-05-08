/*
 * Diseño elegido: Brutalismo administrativo suizo.
 * Panel de identidad institucional con formularios compactos, contraste alto y controles ADMIN explícitos.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ImageUp, Save } from 'lucide-react';
import { api } from '../api/client';
import { buildSystemLogoUrl, defaultSystemSetting, fetchSystemSetting, type SystemSetting } from '../lib/system-settings';

export function SystemSettingsPage() {
  const [setting, setSetting] = useState<SystemSetting>(defaultSystemSetting);
  const [appName, setAppName] = useState(defaultSystemSetting.appName);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingLogo, setSavingLogo] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentLogoUrl = buildSystemLogoUrl(setting.logoUrl);
  const previewLogoUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : currentLogoUrl), [logoFile, currentLogoUrl]);

  useEffect(() => {
    let mounted = true;
    fetchSystemSetting()
      .then((nextSetting) => {
        if (!mounted) return;
        setSetting(nextSetting);
        setAppName(nextSetting.appName);
      })
      .catch(() => mounted && setError('No fue posible cargar la configuración actual.'))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoFile && previewLogoUrl?.startsWith('blob:')) URL.revokeObjectURL(previewLogoUrl);
    };
  }, [logoFile, previewLogoUrl]);

  const notifyLayout = () => window.dispatchEvent(new Event('system-settings-updated'));

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSavingName(true);

    try {
      const response = await api.patch<{ ok: boolean; data: SystemSetting }>('/api/system-settings', { appName });
      setSetting(response.data.data);
      setAppName(response.data.data.appName);
      setSuccess('Nombre del sistema actualizado correctamente.');
      notifyLayout();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'No fue posible actualizar el nombre del sistema.');
    } finally {
      setSavingName(false);
    }
  };

  const saveLogo = async (event: FormEvent) => {
    event.preventDefault();
    if (!logoFile) {
      setError('Selecciona una imagen JPG, PNG o WEBP antes de guardar.');
      return;
    }

    setError('');
    setSuccess('');
    setSavingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      const response = await api.post<{ ok: boolean; data: SystemSetting }>('/api/system-settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSetting(response.data.data);
      setLogoFile(null);
      setSuccess('Logo del sistema actualizado correctamente.');
      notifyLayout();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || 'No fue posible cargar la imagen del sistema.');
    } finally {
      setSavingLogo(false);
    }
  };

  return (
    <section className="pageStack">
      <header className="pageHeader">
        <div>
          <span className="eyebrow">ADMIN / IDENTIDAD LOCAL</span>
          <h1>Sistema</h1>
          <p className="formLead">
            Cambia el nombre visible y la foto/logo que aparecen en la barra lateral. Esta configuración se guarda en tu servidor local y solo puede modificarla un administrador.
          </p>
        </div>
      </header>

      {error && <div className="alertBox">{error}</div>}
      {success && <div className="successBox">{success}</div>}

      <div className="settingsGrid">
        <article className="formShell">
          <span className="eyebrow">Nombre visible</span>
          <form className="adminForm" onSubmit={saveName}>
            <label>
              Nombre del sistema
              <input
                value={appName}
                onChange={(event) => setAppName(event.target.value)}
                minLength={2}
                maxLength={80}
                required
                disabled={loading || savingName}
              />
            </label>
            <p className="mutedText">Ejemplo: Tickets Inventario, Soporte BADABUN o Sistema Interno TI.</p>
            <div className="formActions">
              <button className="primaryAction compact" type="submit" disabled={loading || savingName || appName.trim().length < 2}>
                <Save size={16} /> {savingName ? 'Guardando...' : 'Guardar nombre'}
              </button>
            </div>
          </form>
        </article>

        <article className="formShell systemBrandPanel">
          <span className="eyebrow">Foto / logo</span>
          <div className="brandPreview">
            {previewLogoUrl ? <img src={previewLogoUrl} alt="Vista previa del logo" /> : <span>SYS</span>}
            <strong>{appName || defaultSystemSetting.appName}</strong>
          </div>
          <form className="adminForm" onSubmit={saveLogo}>
            <label className="fileField">
              Imagen del sistema
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setLogoFile(event.target.files?.[0] || null)}
                disabled={loading || savingLogo}
              />
              <span>Formatos permitidos: JPG, PNG o WEBP. Tamaño máximo: 5 MB.</span>
            </label>
            <div className="formActions">
              <button className="primaryAction compact" type="submit" disabled={loading || savingLogo || !logoFile}>
                <ImageUp size={16} /> {savingLogo ? 'Subiendo...' : 'Guardar imagen'}
              </button>
            </div>
          </form>
        </article>
      </div>
    </section>
  );
}
