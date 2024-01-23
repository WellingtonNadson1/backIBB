import { z } from "zod";

enum Role {
  USERLIDER = "USERLIDER",
  USERSUPERVISOR = "USERSUPERVISOR",
  USERCENTRAL = "USERCENTRAL",
  USERPASTOR = "USERPASTOR",
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
}

const roleEnumValidator = (val: string): val is Role =>
  Object.values(Role).includes(val as Role);

const UserDataSchema = z.object({
  id: z.string(),
  supervisao_pertence: z.string().optional(),
  role: z
    .string()
    .refine(roleEnumValidator, { message: "Valor de role inválido" }),
  userIdRefresh: z.string(),
  celula: z.string().optional(),
  image_url: z.string().optional(),
  escolas: z.string().array().optional(),
  encontros: z.string().array().optional(),
  email: z.string().email(),
  password: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  cpf: z.string().optional(),
  date_nascimento: z.string().datetime(),
  sexo: z.string(),
  telefone: z.string(),
  escolaridade: z.string(),
  profissao: z.string().optional(),
  batizado: z.boolean(),
  date_batizado: z.string().datetime().optional(),
  is_discipulado: z.boolean(),
  discipuladorId: z.string().optional(),
  estado_civil: z.string(),
  nome_conjuge: z.string().optional(),
  date_casamento: z.string().datetime().optional(),
  has_filho: z.boolean(),
  quantidade_de_filho: z.number().optional(),
  cep: z.string(),
  cidade: z.string(),
  estado: z.string(),
  bairro: z.string(),
  endereco: z.string(),
  numero_casa: z.string(),
  date_decisao: z.string().datetime().optional(),
  situacao_no_reino: z.string().optional(),
  cargo_de_lideranca: z.string().optional(),
  celula_lidera: z.string().array().optional(),
  escola_lidera: z.string().array().optional(),
  supervisoes_lidera: z.string().array().optional(),
  presencas_aulas_escolas: z.string().array().optional(),
  presencas_reuniao_celula: z.string().array().optional(),
  presencas_cultos: z.string().array().optional(),
  TurmaEscola: z.string().optional(),
});

export type UserData = z.infer<typeof UserDataSchema>
