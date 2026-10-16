import React, { useState } from 'react';
import { ResourcePage, ResourceConfig } from '@/components/ResourcePage';
import { ImportConfig, ImportDialog } from '@/components/ImportDialog';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
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

const WARNING_TEXT: Record<string, string> = {
  phone_invalid: 'telefone inválido, não foi importado',
  email_invalid: 'e-mail inválido, não foi importado',
  cpf_invalid: 'CPF inválido, não foi importado',
  zip_code_invalid: 'CEP inválido, não foi importado',
  state_invalid: 'UF inválida, não foi importada',
  truncated: 'um texto era maior que o permitido e foi cortado',
};
const DUPLICATE_TEXT: Record<string, string> = {
  email: 'e-mail já cadastrado ou repetido na planilha',
  cpf: 'CPF já cadastrado ou repetido na planilha',
  phone: 'telefone já cadastrado ou repetido na planilha',
  name: 'já existe um cliente com este nome (sem e-mail, CPF ou telefone para confirmar que é outra pessoa)',
};

const importConfig: ImportConfig = {
  title: 'Importar clientes',
  plural: 'clientes',
  endpoint: '/api/customers/import',
  hint: 'Dica: só o nome é obrigatório. Telefone, e-mail, CPF, endereço e o resto são opcionais, e um valor inválido é ignorado sem impedir a importação do cliente.',
  fields: [
    { key: 'full_name', label: 'Nome completo (separado em nome e sobrenome)', aliases: ['nome', 'nome completo', 'cliente', 'nome do cliente', 'name'] },
    { key: 'first_name', label: 'Primeiro nome', aliases: ['primeiro nome', 'first name'] },
    { key: 'last_name', label: 'Sobrenome', aliases: ['sobrenome', 'ultimo nome', 'last name'] },
    { key: 'phone', label: 'Telefone / WhatsApp', aliases: ['telefone', 'celular', 'whatsapp', 'whats', 'fone', 'tel', 'contato', 'phone', 'numero'] },
    { key: 'email', label: 'E-mail', aliases: ['email', 'e mail', 'mail'] },
    { key: 'cpf', label: 'CPF', aliases: ['cpf'] },
    { key: 'delivery_address', label: 'Endereço de entrega', aliases: ['endereco', 'endereco de entrega', 'rua', 'logradouro', 'address'] },
    { key: 'city', label: 'Cidade', aliases: ['cidade', 'municipio', 'city'] },
    { key: 'state', label: 'UF', aliases: ['uf', 'estado', 'state'] },
    { key: 'zip_code', label: 'CEP', aliases: ['cep', 'codigo postal'] },
    { key: 'notes', label: 'Observações', aliases: ['observacao', 'observacoes', 'obs', 'notas', 'anotacoes'] },
  ],
  options: [
    {
      key: 'skip_same_phone',
      label: 'Ignorar quem já tem o mesmo telefone cadastrado',
      help: 'Evita duplicar clientes ao importar a mesma planilha de novo. Desligue se pessoas diferentes dividem o mesmo número.',
      defaultValue: true,
    },
  ],
  missing: (mapped) => (mapped.has('full_name') || mapped.has('first_name') ? null : 'Escolha a coluna do nome do cliente (campo “Nome completo” ou “Primeiro nome”).'),
  describe: (p) => {
    const warnings = p.warnings.map((w) => WARNING_TEXT[w] ?? w).join('; ');
    if (p.status === 'error') return 'sem nome: a linha não será importada';
    if (p.status === 'duplicate') return `não será importado: ${DUPLICATE_TEXT[p.reason ?? ''] ?? 'já cadastrado'}`;
    return `será importado, mas ${warnings}`;
  },
};

export default function CustomersScreen() {
  const { user } = useAuth();
  const canImport = user?.role === 'admin' || user?.role === 'manager';
  const [importing, setImporting] = useState(false);
  const [reload, setReload] = useState<(() => void) | null>(null);

  return (
    <>
      <ResourcePage
        config={config}
        canWrite
        headerActions={({ reload: r }) =>
          canImport ? (
            <Button
              label="Importar planilha"
              variant="secondary"
              onPress={() => {
                setReload(() => r);
                setImporting(true);
              }}
            />
          ) : null
        }
      />
      <ImportDialog config={importConfig} visible={importing} onClose={() => setImporting(false)} onImported={() => reload?.()} />
    </>
  );
}
