import React from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ActiveBadge } from '@/components/ui/Feedback';
import { maskCnpj } from '@/lib/cnpj';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { Supplier } from '@/lib/types';

const config: ResourceConfig<Supplier> = {
  title: 'Fornecedores',
  subtitle: 'De quem você compra insumos.',
  singular: 'fornecedor',
  endpoint: '/api/suppliers',
  itemName: (s) => s.name,
  columns: () => [
    {
      key: 'name',
      title: 'Fornecedor',
      render: (s) => (
        <>
          <Primary>{s.name}</Primary>
          <Secondary>{s.contact_person}</Secondary>
        </>
      ),
    },
    { key: 'cnpj', title: 'CNPJ', width: 170, render: (s) => <Plain>{s.cnpj ? maskCnpj(s.cnpj) : ''}</Plain> },
    {
      key: 'contact',
      title: 'Contato',
      render: (s) => (
        <>
          <Plain>{s.phone}</Plain>
          <Secondary>{s.email}</Secondary>
        </>
      ),
    },
    { key: 'city', title: 'Cidade', width: 150, render: (s) => <Plain>{[s.city, s.state].filter(Boolean).join(' / ')}</Plain> },
    { key: 'active', title: 'Situação', width: 100, render: (s) => <ActiveBadge active={s.active} /> },
  ],
  fields: [
    { key: 'name', label: 'Nome', required: true, maxLength: 255 },
    { key: 'cnpj', label: 'CNPJ', mask: 'cnpj' },
    { key: 'contact_person', label: 'Pessoa de contato' },
    { key: 'phone', label: 'Telefone', mask: 'phone' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'address', label: 'Endereço' },
    { key: 'city', label: 'Cidade' },
    { key: 'state', label: 'UF', mask: 'uf' },
    { key: 'zip_code', label: 'CEP', mask: 'cep' },
    { key: 'notes', label: 'Observações', type: 'textarea' },
    { key: 'active', label: 'Ativo', type: 'switch', editOnly: true },
  ],
};

export default function SuppliersScreen() {
  return <ResourcePage config={config} canWrite />;
}
