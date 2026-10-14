import React from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ActiveBadge, Badge } from '@/components/ui/Feedback';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { formatNumber } from '@/lib/format';
import { Supply } from '@/lib/types';

const TYPE_LABEL: Record<Supply['type'], string> = {
  ingredient: 'Ingrediente',
  packaging: 'Embalagem',
  cleaning: 'Limpeza',
  other: 'Outro',
};

const UNITS = ['kg', 'g', 'L', 'ml', 'un', 'cx', 'pct', 'dz'].map((u) => ({ value: u, label: u }));

const config: ResourceConfig<Supply> = {
  title: 'Insumos',
  subtitle: 'Ingredientes, embalagens e materiais. O saldo sobe quando você registra uma compra.',
  singular: 'insumo',
  endpoint: '/api/supplies',
  itemName: (s) => s.name,
  columns: () => [
    {
      key: 'name',
      title: 'Insumo',
      render: (s) => (
        <>
          <Primary>{s.name}</Primary>
          <Secondary>{s.description}</Secondary>
        </>
      ),
    },
    { key: 'type', title: 'Tipo', width: 130, render: (s) => <Plain>{TYPE_LABEL[s.type] ?? s.type}</Plain> },
    {
      key: 'amount',
      title: 'Em estoque',
      width: 150,
      align: 'right',
      render: (s) =>
        Number(s.amount) > 0 ? (
          <Plain>{`${formatNumber(s.amount)} ${s.unit_measure}`}</Plain>
        ) : (
          <Badge label="Sem estoque" tone="danger" />
        ),
    },
    { key: 'active', title: 'Situação', width: 100, render: (s) => <ActiveBadge active={s.active} /> },
  ],
  fields: [
    { key: 'name', label: 'Nome', required: true, maxLength: 255 },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      defaultValue: 'ingredient',
      options: Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })),
    },
    { key: 'unit_measure', label: 'Unidade de medida', type: 'select', required: true, options: UNITS, defaultValue: 'kg' },
    {
      key: 'amount',
      label: 'Quantidade em estoque',
      type: 'decimal',
      defaultValue: '0',
      help: 'Normalmente atualizada pelas compras; use aqui para corrigir a contagem.',
    },
    { key: 'description', label: 'Descrição', type: 'textarea' },
    { key: 'active', label: 'Ativo', type: 'switch', editOnly: true },
  ],
};

export default function SuppliesScreen() {
  return <ResourcePage config={config} canWrite />;
}
