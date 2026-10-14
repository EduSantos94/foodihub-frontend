import React from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ActiveBadge } from '@/components/ui/Feedback';
import { Plain, Primary } from '@/components/ui/Cell';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/lib/types';

const config: ResourceConfig<Category> = {
  title: 'Categorias',
  subtitle: 'Agrupam os produtos do cardápio (ex.: Pizzas, Bebidas, Sobremesas). Escolha uma delas ao cadastrar um produto.',
  singular: 'categoria',
  feminine: true,
  endpoint: '/api/categories',
  itemName: (c) => c.name,
  columns: () => [
    { key: 'name', title: 'Nome', render: (c) => <Primary>{c.name}</Primary> },
    { key: 'description', title: 'Descrição', render: (c) => <Plain>{c.description}</Plain> },
    { key: 'active', title: 'Situação', width: 110, render: (c) => <ActiveBadge active={c.active} /> },
  ],
  fields: [
    { key: 'name', label: 'Nome', required: true, maxLength: 100 },
    { key: 'description', label: 'Descrição', type: 'textarea' },
    { key: 'active', label: 'Ativa', type: 'switch', editOnly: true },
  ],
};

export default function CategoriesScreen() {
  const { user } = useAuth();
  return (
    <ResourcePage
      config={config}
      canWrite={user?.is_platform_admin === true}
      readOnlyNote="As categorias são mantidas pela plataforma e compartilhadas por todas as lojas. Você pode escolher entre elas ao cadastrar produtos; para pedir uma nova, fale com o administrador do sistema."
    />
  );
}
