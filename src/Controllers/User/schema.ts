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

export const UserDataSchema = z
  .object({
    id: z.string().optional(), // Opcional, geralmente gerado pelo Prisma
    email: z.string().email("Email inválido"),
    password: z.string(), // Mantido como obrigatório na API, mas pode ter valor padrão no frontend
    first_name: z.string().min(1, "Nome é obrigatório"),
    last_name: z.string().min(1, "Sobrenome é obrigatório"),
    telefone: z.string().min(10, "Telefone inválido"),
    sexo: z.enum(["M", "F"], { required_error: "Sexo é obrigatório" }),
    situacao_no_reino: z
      .string()
      .uuid({ message: "Situação no Reino é obrigatória" }),
    cargo_de_lideranca: z
      .string()
      .uuid({ message: "Cargo de Liderança é obrigatório" }),
    supervisao_pertence: z
      .string()
      .uuid({ message: "Supervisão é obrigatória" }),
    celula: z.string().uuid().optional(),
    estado_civil: z.enum(
      ["solteiro", "casado", "divorciado", "uniao_estavel", "viuvo"],
      { required_error: "Estado Civil é obrigatório" }
    ),
    // Campos opcionais
    role: z
      .string()
      .refine(roleEnumValidator, { message: "Valor de role inválido" })
      .optional()
      .default("MEMBER"), // Valor padrão alinhado com Prisma
    userIdRefresh: z.string().optional(),
    image_url: z.string().optional(),
    cpf: z.string().optional(),
    date_nascimento: z.string().datetime().optional(),
    escolaridade: z.string().optional(),
    profissao: z.string().optional(),
    batizado: z.boolean().optional(),
    date_batizado: z.string().datetime().optional(),
    is_discipulado: z.boolean().optional(),
    discipuladorId: z.string().uuid().optional(),
    nome_conjuge: z.string().optional(),
    date_casamento: z.string().datetime().optional(),
    has_filho: z.boolean().optional(),
    quantidade_de_filho: z.number().optional(),
    cep: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    bairro: z.string().optional(),
    endereco: z.string().optional(),
    numero_casa: z.string().optional(),
    date_decisao: z.string().datetime().optional(),
    escolas: z
      .array(z.object({ id: z.string().uuid(), nome: z.string() }))
      .optional(),
    encontros: z
      .array(z.object({ id: z.string().uuid(), nome: z.string() }))
      .optional(),
    celula_lidera: z.string().array().optional(),
    escola_lidera: z.string().array().optional(),
    supervisoes_lidera: z.string().array().optional(),
    presencas_aulas_escolas: z.string().array().optional(),
    presencas_reuniao_celula: z.string().array().optional(),
    presencas_cultos: z.string().array().optional(),
    TurmaEscola: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.has_filho && !data.quantidade_de_filho) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantidade_de_filho"],
        message: "Quantidade de filhos é obrigatória se tem filhos",
      });
    }
    if (data.batizado && !data.date_batizado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_batizado"],
        message: "Data do batismo é obrigatória se batizado",
      });
    }
  });

export type UserData = z.infer<typeof UserDataSchema>;

export const UserDataUpdateSchema = z
  .object({
    id: z.string().optional(), // Opcional, gerado pelo Prisma
    email: z.string().email("Email inválido"),
    password: z.string().optional(), // Opcional no update
    first_name: z.string().min(1, "Nome é obrigatório"),
    last_name: z.string().min(1, "Sobrenome é obrigatório"),
    telefone: z.string().min(10, "Telefone inválido"),
    sexo: z.enum(["M", "F"], { required_error: "Sexo é obrigatório" }),
    situacao_no_reino: z
      .string()
      .uuid({ message: "Situação no Reino é obrigatória" }),
    cargo_de_lideranca: z
      .string()
      .uuid({ message: "Cargo de Liderança é obrigatório" }),
    supervisao_pertence: z
      .string()
      .uuid({ message: "Supervisão é obrigatória" }),
    celula: z.string().uuid().optional(),
    estado_civil: z.enum(
      ["solteiro", "casado", "divorciado", "uniao_estavel", "viuvo"],
      { required_error: "Estado Civil é obrigatório" }
    ),
    // Campos opcionais
    role: z
      .string()
      .refine(roleEnumValidator, { message: "Valor de role inválido" })
      .optional()
      .default("MEMBER"),
    userIdRefresh: z.string().optional(),
    image_url: z.string().optional(),
    cpf: z.string().optional(),
    date_nascimento: z.string().datetime().optional(), // String ISO 8601
    escolaridade: z.string().optional(),
    profissao: z.string().optional(),
    batizado: z.boolean().optional(),
    date_batizado: z.string().datetime().optional(), // String ISO 8601
    is_discipulado: z.boolean().optional(),
    discipuladorId: z.string().uuid().optional(),
    nome_conjuge: z.string().optional(),
    date_casamento: z.string().datetime().optional(), // String ISO 8601
    has_filho: z.boolean().optional(),
    quantidade_de_filho: z.number().optional(),
    cep: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    bairro: z.string().optional(),
    endereco: z.string().optional(),
    numero_casa: z.string().optional(),
    date_decisao: z.string().datetime().optional(), // String ISO 8601
    escolas: z
      .array(z.object({ id: z.string().uuid(), nome: z.string() }))
      .optional(),
    encontros: z
      .array(z.object({ id: z.string().uuid(), nome: z.string() }))
      .optional(),
    celula_lidera: z.string().array().optional(),
    escola_lidera: z.string().array().optional(),
    supervisoes_lidera: z.string().array().optional(),
    presencas_aulas_escolas: z.string().array().optional(),
    presencas_reuniao_celula: z.string().array().optional(),
    presencas_cultos: z.string().array().optional(),
    TurmaEscola: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.has_filho && !data.quantidade_de_filho) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quantidade_de_filho"],
        message: "Quantidade de filhos é obrigatória se tem filhos",
      });
    }
    if (data.batizado && !data.date_batizado) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_batizado"],
        message: "Data do batismo é obrigatória se batizado",
      });
    }
  });

export type UserDataUpdate = z.infer<typeof UserDataUpdateSchema>;

const statusUpdateSchema = z.object({
  id: z.string(),
  status: z.string(),
  title: z.string(),
  description: z.string().min(1, { message: "A comment is required." }),
  date: z
    .object({
      from: z.date().optional(),
      to: z.date().optional(),
    })
    .refine((date) => {
      return !!date.from;
    }),
});

export type TStatusUpdate = z.infer<typeof statusUpdateSchema>;
