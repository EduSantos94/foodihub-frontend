import React from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ActiveBadge, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { maskCnpj } from '@/lib/cnpj';
import { formatPhone } from '@/lib/masks';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { useAuth } from '@/contexts/AuthContext';
import { api, errorMessage } from '@/lib/api';
import { Store } from '@/lib/types';

const config: ResourceConfig<Store> = {
  title: 'Lojas',
  subtitle: 'Todas as lojas da plataforma. Novas lojas entram pelo cadastro público.',
  singular: 'loja',
  feminine: true,
  endpoint: '/api/admin/stores',
  noCreate: true,
  itemName: (s) => s.name,
  columns: () => [
    {
      key: 'name',
      title: 'Loja',
      render: (s) => (
        <>
          <Primary>{s.name}</Primary>
          <Secondary>{maskCnpj(s.document)}</Secondary>
        </>
      ),
    },
    {
      key: 'contact',
      title: 'Contato',
      render: (s) => (
        <>
          <Plain>{s.email}</Plain>
          <Secondary>{s.phone ? formatPhone(s.phone) : ''}</Secondary>
        </>
      ),
    },
    { key: 'city', title: 'Cidade', width: 150, render: (s) => <Plain>{[s.city, s.state].filter(Boolean).join(' / ')}</Plain> },
    { key: 'active', title: 'Situação', width: 100, render: (s) => <ActiveBadge active={s.active} /> },
  ],
  fields: [
    { key: 'name', label: 'Nome', required: true, maxLength: 255 },
    { key: 'email', label: 'E-mail', type: 'email', required: true },
    { key: 'phone', label: 'Telefone', mask: 'phone' },
    { key: 'document', label: 'CNPJ', required: true, mask: 'cnpj' },
    { key: 'address', label: 'Endereço' },
    { key: 'city', label: 'Cidade' },
    { key: 'state', label: 'UF', mask: 'uf' },
    { key: 'zip_code', label: 'CEP', mask: 'cep' },
  ],
};

export default function StoresScreen() {
  const { user } = useAuth();
  if (user?.is_platform_admin !== true) {
    return <EmptyState title="Acesso restrito" hint="Somente o administrador do sistema gerencia as lojas." />;
  }
  return (
    <ResourcePage
      config={config}
      canWrite
      rowActions={(store, { reload, notify, fail }) => (
        <Button
          label={store.active ? 'Desativar' : 'Ativar'}
          variant="ghost"
          small
          onPress={async () => {
            try {
              await api.patch(`/api/admin/stores/${store.id}/${store.active ? 'deactivate' : 'activate'}`);
              notify(`Loja ${store.name} ${store.active ? 'desativada' : 'ativada'}.`);
              reload();
            } catch (e) {
              fail(errorMessage(e, 'Não foi possível alterar a loja.'));
            }
          }}
        />
      )}
    />
  );
}
