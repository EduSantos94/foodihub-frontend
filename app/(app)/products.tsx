import React, { useState } from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ProductSizesDialog } from '@/components/ProductSizesDialog';
import { Button } from '@/components/ui/Button';
import { ActiveBadge, Badge } from '@/components/ui/Feedback';
import { Plain, Primary, Secondary } from '@/components/ui/Cell';
import { formatBRL } from '@/lib/format';
import { Product } from '@/lib/types';

const config: ResourceConfig<Product> = {
  title: 'Produtos',
  subtitle: 'O que você vende. Cada venda desconta a quantidade em estoque.',
  singular: 'produto',
  endpoint: '/api/products',
  itemName: (p) => p.name,
  lookups: { category_id: { endpoint: '/api/categories', label: (c) => c.name } },
  columns: (lookups) => [
    {
      key: 'name',
      title: 'Produto',
      render: (p) => (
        <>
          <Primary>{p.name}</Primary>
          <Secondary>{p.description}</Secondary>
        </>
      ),
    },
    { key: 'category', title: 'Categoria', width: 160, render: (p) => <Plain>{p.category_id ? lookups.category_id?.get(p.category_id) : ''}</Plain> },
    { key: 'price', title: 'Preço', width: 110, align: 'right', render: (p) => <Plain>{formatBRL(p.price)}</Plain> },
    {
      key: 'amount',
      title: 'Estoque',
      width: 120,
      align: 'right',
      render: (p) => (Number(p.amount) > 0 ? <Plain>{`${p.amount} un`}</Plain> : <Badge label="Sem estoque" tone="danger" />),
    },
    { key: 'active', title: 'Situação', width: 100, render: (p) => <ActiveBadge active={p.active} /> },
  ],
  fields: [
    { key: 'name', label: 'Nome', required: true, maxLength: 255 },
    { key: 'description', label: 'Descrição', type: 'textarea' },
    { key: 'price', label: 'Preço (R$)', type: 'decimal', required: true, placeholder: '0,00' },
    { key: 'amount', label: 'Quantidade em estoque', type: 'integer', defaultValue: '0', help: 'Cada venda desconta daqui. Com 0, o produto não pode ser vendido.' },
    { key: 'category_id', label: 'Categoria', type: 'select', remote: { endpoint: '/api/categories', label: (c) => c.name, emptyLabel: 'Sem categoria', filter: (c) => c.active } },
    { key: 'active', label: 'Ativo', type: 'switch', editOnly: true },
  ],
};

export default function ProductsScreen() {
  const [sizesFor, setSizesFor] = useState<Product | null>(null);
  return (
    <>
      <ResourcePage
        config={config}
        canWrite
        rowActions={(p) => <Button label="Tamanhos" variant="ghost" small onPress={() => setSizesFor(p)} />}
      />
      <ProductSizesDialog product={sizesFor} onClose={() => setSizesFor(null)} />
    </>
  );
}
