import React from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ActiveBadge } from '@/components/ui/Feedback';
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
    { key: 'cnpj', title: 'CNPJ', width: 170, render: (s) => <Plain>{s.cnpj}</Plain> },
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
    { key: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00', maxLength: 18 },
    { key: 'contact_person', label: 'Pessoa de contato' },
    { key: 'phone', label: 'Telefone', maxLength: 20 },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'address', label: 'Endereço' },
    { key: 'city', label: 'Cidade' },
    { key: 'state', label: 'UF', maxLength: 2, placeholder: 'SP' },
    { key: 'zip_code', label: 'CEP', maxLength: 10 },
    { key: 'notes', label: 'Observações', type: 'textarea' },
    { key: 'active', label: 'Ativo', type: 'switch', editOnly: true },
  ],
};

export default function SuppliersScreen() {
  return <ResourcePage config={config} canWrite />;
}
