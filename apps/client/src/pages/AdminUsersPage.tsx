/**
 * Diseño elegido: Brutalismo administrativo suizo.
 * Administración de usuarios y departamentos con tabla operativa, controles compactos y listas desplegables normalizadas.
 */
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, type Department, type Role, type User } from '../api/client';

type DepartmentForm = {
  name: string;
  description: string;
};

const initialDepartmentForm: DepartmentForm = { name: '', description: '' };

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>(initialDepartmentForm);
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    const { data } = await api.get('/api/users');
    setUsers(data.data);
  }

  async function loadDepartments() {
    const { data } = await api.get('/api/departments');
    setDepartments(data.data);
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadUsers(), loadDepartments()]);
    } catch {
      setError('No fue posible cargar usuarios y departamentos. Verifica permisos ADMIN y backend local.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const visibleUsers = useMemo(() => {
    return [...users]
      .filter((item) => departmentFilter === 'ALL' || (departmentFilter === 'NONE' ? !item.departmentId : item.departmentId === departmentFilter))
      .sort((a, b) => {
        const departmentA = a.department?.name || 'ZZZ Sin departamento';
        const departmentB = b.department?.name || 'ZZZ Sin departamento';
        return departmentA.localeCompare(departmentB, 'es') || a.name.localeCompare(b.name, 'es');
      });
  }, [departmentFilter, users]);

  function updateUserLocal(userId: string, changes: Partial<User>) {
    setUsers((current) => current.map((item) => (item.id === userId ? { ...item, ...changes } : item)));
  }

  async function saveUser(userItem: User) {
    setSavingUserId(userItem.id);
    setError(null);
    try {
      const { data } = await api.patch(`/api/users/${userItem.id}`, {
        name: userItem.name,
        role: userItem.role,
        isActive: userItem.isActive ?? true,
        departmentId: userItem.departmentId || null
      });
      const savedUser: User = data.data;
      setUsers((current) => current.map((item) => (item.id === savedUser.id ? savedUser : item)));
    } catch (requestError: any) {
      const message = requestError?.response?.data?.error || 'No fue posible guardar el usuario. Revisa nombre, rol y departamento.';
      setError(message);
    } finally {
      setSavingUserId(null);
    }
  }

  async function handleDepartmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!departmentForm.name.trim()) return;
    setSavingDepartment(true);
    setError(null);
    try {
      const { data } = await api.post('/api/departments', {
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim() || null
      });
      const createdDepartment: Department = data.data;
      await loadDepartments();
      setDepartmentFilter(createdDepartment.id);
      setDepartmentForm(initialDepartmentForm);
    } catch (requestError: any) {
      const message = requestError?.response?.data?.error || 'No fue posible crear el departamento. Revisa que el nombre no esté vacío o duplicado.';
      setError(message);
    } finally {
      setSavingDepartment(false);
    }
  }

  return (
    <section className="pageStack">
      <header className="pageHeader adminUsersHeader">
        <div>
          <p className="eyebrow">Módulo 03 · Administración</p>
          <h1>Usuarios</h1>
          <p className="lead">Edita usuarios registrados, asigna departamentos normalizados y conserva la lista ordenada por área para evitar duplicados o variantes escritas a mano.</p>
        </div>
      </header>

      {error && <div className="alertBox">{error}</div>}

      <section className="adminGrid">
        <form className="formShell adminForm departmentCreateCard" onSubmit={handleDepartmentSubmit}>
          <div>
            <p className="eyebrow">Catálogo</p>
            <h2>Crear departamento</h2>
          </div>
          <label>
            Departamento
            <input value={departmentForm.name} onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ej. Recursos Humanos" minLength={2} maxLength={120} required />
          </label>
          <label>
            Descripción opcional
            <input value={departmentForm.description} onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))} placeholder="Ej. Altas, bajas y expedientes" maxLength={500} />
          </label>
          <button className="primaryAction compact" type="submit" disabled={savingDepartment || !departmentForm.name.trim()}>{savingDepartment ? 'Guardando...' : 'Guardar departamento'}</button>
        </form>

        <aside className="departmentPanel">
          <p className="eyebrow">Orden</p>
          <h2>Filtro por departamento</h2>
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}>
            <option value="ALL">Todos los departamentos</option>
            <option value="NONE">Sin departamento</option>
            {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <p>La lista se ordena primero por departamento y después por nombre. La asignación se hace con lista desplegable para mantener datos consistentes.</p>
        </aside>
      </section>

      <div className="inventoryTableShell usersTableShell">
        <table className="inventoryTable usersAdminTable">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Departamento</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((userItem) => (
              <tr key={userItem.id}>
                <td>
                  <input value={userItem.name} onChange={(event) => updateUserLocal(userItem.id, { name: event.target.value })} />
                </td>
                <td><span className="folio">{userItem.email}</span></td>
                <td>
                  <select value={userItem.departmentId || ''} onChange={(event) => {
                    const departmentId = event.target.value || null;
                    const department = departments.find((item) => item.id === departmentId) || null;
                    updateUserLocal(userItem.id, { departmentId, department });
                  }}>
                    <option value="">Sin departamento</option>
                    {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                  </select>
                </td>
                <td>
                  <select value={userItem.role} onChange={(event) => updateUserLocal(userItem.id, { role: event.target.value as Role })}>
                    <option value="USER">Usuario</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </td>
                <td>
                  <select value={userItem.isActive === false ? 'INACTIVE' : 'ACTIVE'} onChange={(event) => updateUserLocal(userItem.id, { isActive: event.target.value === 'ACTIVE' })}>
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </td>
                <td>
                  <button className="linkAction" type="button" onClick={() => saveUser(userItem)} disabled={savingUserId === userItem.id}>{savingUserId === userItem.id ? 'Guardando' : 'Guardar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && visibleUsers.length === 0 && <div className="emptyState">No hay usuarios para el filtro seleccionado.</div>}
        {loading && <div className="emptyState">Cargando usuarios...</div>}
      </div>
    </section>
  );
}
