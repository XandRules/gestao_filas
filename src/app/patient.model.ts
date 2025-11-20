export type Classificacao = 'normal' | 'urgente';

export interface Paciente {
  id: string;
  nome: string;
  cpf?: string;
  dataNascimento?: string; // ISO yyyy-mm-dd
  contato?: string; // telefone/email
  queixa?: string;
  classificacao: Classificacao;
  createdAt: number;
  status: 'pre_consulta' | 'atendimento' | 'finalizado';
  unidadeId?: string;
}