import { trpc } from '../_core/trpc';

export function UsersPage() {
  const utils = trpc.useUtils();
  const users = trpc.users.list.useQuery();
  const setRole = trpc.users.setRole.useMutation({ onSuccess: async () => utils.users.invalidate() });
  const setActive = trpc.users.setActive.useMutation({ onSuccess: async () => utils.users.invalidate() });

  return (
    <section className="page-stack">
      <header className="page-header"><div><span className="eyebrow">ADMIN_USERS</span><h2>Usuarios</h2></div><p>Roles y acceso al sistema.</p></header>
      <div className="panel">
        <div className="table-list">
          {users.data?.map((user: any) => <div className="table-row" key={user.id}><strong>{user.name}</strong><span>{user.email}</span><select value={user.role} onChange={(e) => setRole.mutate({ userId: user.id, role: e.target.value as 'admin' | 'user' })}><option value="admin">Admin</option><option value="user">Usuario</option></select><button onClick={() => setActive.mutate({ userId: user.id, isActive: !user.isActive })}>{user.isActive ? 'Desactivar' : 'Activar'}</button></div>)}
        </div>
      </div>
    </section>
  );
}
