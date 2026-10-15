import React from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ActiveBadge, Badge, EmptyState } from '@/components/ui/Feedback';
import { formatPhone } from '@/lib/masks';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { useAuth } from '@/contexts/AuthContext';
import { fullName } from '@/lib/format';
import { ROLE_LABEL, StoreUser } from '@/lib/types';

const config: ResourceConfig<StoreUser> = {
  title: 'Usuários',
  subtitle: 'Quem tem acesso ao sistema da sua loja.',
  singular: 'usuário',
  endpoint: '/api/users',
  noDelete: true,
  minPasswordLength: 8,
  emptyHint: 'Use “Novo usuário” para convidar alguém da equipe.',
  itemName: fullName,
  columns: () => [
    {
      key: 'name',
      title: 'Usuário',
      render: (u) => (
        <>
          <Primary>{fullName(u)}</Primary>
          <Secondary>{u.email}</Secondary>
        </>
      ),
    },
    { key: 'phone', title: 'Telefone', width: 160, render: (u) => <Plain>{u.phone ? formatPhone(u.phone) : ''}</Plain> },
    { key: 'role', title: 'Papel', width: 150, render: (u) => <Badge label={ROLE_LABEL[u.role] ?? u.role} tone={u.role === 'admin' ? 'warning' : 'neutral'} /> },
    { key: 'active', title: 'Situação', width: 100, render: (u) => <ActiveBadge active={u.active} /> },
  ],
  fields: [
    { key: 'first_name', label: 'Nome', required: true, maxLength: 100 },
    { key: 'last_name', label: 'Sobrenome', maxLength: 100 },
    { key: 'email', label: 'E-mail', type: 'email', required: true, createOnly: true },
    { key: 'password', label: 'Senha inicial', type: 'password', required: true, createOnly: true, help: 'Mínimo de 8 caracteres. A pessoa pode trocá-la depois em Meu perfil.' },
    {
      key: 'role',
      label: 'Papel',
      type: 'select',
      required: true,
      createOnly: true,
      defaultValue: 'staff',
      options: [
        { value: 'staff', label: 'Equipe: vende e consulta' },
        { value: 'manager', label: 'Gerente: também cancela vendas e gerencia integrações' },
        { value: 'admin', label: 'Administrador: acesso total à loja' },
      ],
    },
    { key: 'phone', label: 'Telefone', mask: 'phone' },
    { key: 'active', label: 'Ativo', type: 'switch', editOnly: true, help: 'Desativar bloqueia o acesso na hora.' },
  ],
};

export default function UsersScreen() {
  const { user } = useAuth();
  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return <EmptyState title="Acesso restrito" hint="Somente administradores e gerentes veem os usuários da loja." />;
  }
  return (
    <ResourcePage
      config={config}
      canWrite={user.role === 'admin'}
      readOnlyNote="Somente administradores criam ou editam usuários."
    />
  );
}
