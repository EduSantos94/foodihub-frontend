import React, { useState } from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { IntegrationWebhooksDialog } from '@/components/IntegrationWebhooksDialog';
import { ActiveBadge, Badge, EmptyState } from '@/components/ui/Feedback';
import { Button } from '@/components/ui/Button';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { useAuth } from '@/contexts/AuthContext';
import { INTEGRATION_STATUS_LABEL, INTEGRATION_TYPE_LABEL, Integration } from '@/lib/types';

const config: ResourceConfig<Integration> = {
  title: 'Integrações',
  subtitle: 'Canais de venda (iFood, aiqfome) e webhooks que avisam outros sistemas sobre os pedidos. Os conectores iFood e aiqfome ainda estão em desenvolvimento: por enquanto a integração guarda a configuração e dispara webhooks.',
  singular: 'integração',
  feminine: true,
  endpoint: '/api/integrations',
  itemName: (i) => i.name,
  columns: () => [
    {
      key: 'name',
      title: 'Integração',
      render: (i) => (
        <>
          <Primary>{i.name}</Primary>
          <Secondary>{INTEGRATION_TYPE_LABEL[i.type]}</Secondary>
        </>
      ),
    },
    {
      key: 'keys',
      title: 'Credenciais',
      width: 150,
      render: (i) => <Plain>{i.has_api_key ? (i.has_api_secret ? 'Chave e segredo' : 'Só a chave') : 'Não informadas'}</Plain>,
    },
    {
      key: 'status',
      title: 'Status',
      width: 130,
      render: (i) => (
        <>
          <Badge label={INTEGRATION_STATUS_LABEL[i.status]} tone={i.status === 'active' ? 'success' : i.status === 'error' ? 'danger' : 'neutral'} />
          <Secondary>{i.last_error}</Secondary>
        </>
      ),
    },
    { key: 'active', title: 'Situação', width: 100, render: (i) => <ActiveBadge active={i.active} /> },
  ],
  fields: [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      createOnly: true,
      defaultValue: 'custom',
      help: 'Cada tipo só pode existir uma vez por loja e não pode ser trocado depois.',
      options: [
        { value: 'ifood', label: 'iFood' },
        { value: 'aiqfome', label: 'aiqfome' },
        { value: 'custom', label: 'Personalizada' },
      ],
    },
    { key: 'name', label: 'Nome', required: true, maxLength: 255 },
    { key: 'api_key', label: 'Chave de API', type: 'password', maxLength: 250, help: 'Guardada criptografada e nunca exibida. Ao editar, deixe em branco para manter a atual.' },
    { key: 'api_secret', label: 'Segredo da API', type: 'password', maxLength: 250, help: 'Ao editar, deixe em branco para manter o atual.' },
    { key: 'webhook_url', label: 'URL de webhook (recebimento)', placeholder: 'https://' },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      editOnly: true,
      options: [
        { value: 'inactive', label: 'Inativa' },
        { value: 'active', label: 'Conectada' },
        { value: 'error', label: 'Com erro' },
      ],
    },
    { key: 'active', label: 'Ativa', type: 'switch', editOnly: true },
  ],
};

export default function IntegrationsScreen() {
  const { user } = useAuth();
  const [hooksFor, setHooksFor] = useState<Integration | null>(null);

  if (user?.role !== 'admin' && user?.role !== 'manager') {
    return <EmptyState title="Acesso restrito" hint="Somente administradores e gerentes gerenciam integrações." />;
  }
  return (
    <>
      <ResourcePage
        config={config}
        canWrite
        rowActions={(i) => <Button label="Webhooks" variant="ghost" small onPress={() => setHooksFor(i)} />}
      />
      <IntegrationWebhooksDialog integration={hooksFor} onClose={() => setHooksFor(null)} />
    </>
  );
}
