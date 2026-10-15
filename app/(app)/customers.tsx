import React from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ActiveBadge } from '@/components/ui/Feedback';
import { formatCpf, formatPhone } from '@/lib/masks';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { fullName } from '@/lib/format';
import { Customer } from '@/lib/types';

const config: ResourceConfig<Customer> = {
  title: 'Clientes',
  subtitle: 'Quem compra de você.',
  singular: 'cliente',
  endpoint: '/api/customers',
  itemName: fullName,
  columns: () => [
    {
      key: 'name',
      title: 'Cliente',
      render: (c) => (
        <>
          <Primary>{fullName(c)}</Primary>
          <Secondary>{c.cpf ? formatCpf(c.cpf) : ''}</Secondary>
        </>
      ),
    },
    {
      key: 'contact',
      title: 'Contato',
      render: (c) => (
        <>
          <Plain>{c.phone ? formatPhone(c.phone) : ''}</Plain>
          <Secondary>{c.email}</Secondary>
        </>
      ),
    },
    { key: 'city', title: 'Cidade', width: 150, render: (c) => <Plain>{[c.city, c.state].filter(Boolean).join(' / ')}</Plain> },
    { key: 'active', title: 'Situação', width: 100, render: (c) => <ActiveBadge active={c.active} /> },
  ],
  fields: [
    { key: 'first_name', label: 'Nome', required: true, maxLength: 100 },
    { key: 'last_name', label: 'Sobrenome', maxLength: 100 },
    { key: 'phone', label: 'Telefone', mask: 'phone' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'cpf', label: 'CPF', mask: 'cpf' },
    { key: 'delivery_address', label: 'Endereço de entrega' },
    { key: 'city', label: 'Cidade' },
    { key: 'state', label: 'UF', mask: 'uf' },
    { key: 'zip_code', label: 'CEP', mask: 'cep' },
    { key: 'notes', label: 'Observações', type: 'textarea' },
    { key: 'active', label: 'Ativo', type: 'switch', editOnly: true },
  ],
};

export default function CustomersScreen() {
  return <ResourcePage config={config} canWrite />;
}
