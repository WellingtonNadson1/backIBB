import { Input, boolean, object, string } from "valibot";

export type CultoIndividual = {
  startDate: Date;
  endDate: Date;
  superVisionId: string;
  cargoLideranca: string[];
}

export type dataSchemaCreateDiscipuladoSupervisor = {
  usuario_id: string,
  supervisor_id: string
  data_ocorreu: Date
}

export type dataSchemaCreateDiscipuladoCell = {
  usuario_id: string,
  discipulador_id: string
  cell_id: string
  data_ocorreu: Date
}

export type dataSchemaCreateDiscipulado = {
  usuario_id: string,
  discipulador_id: string
  data_ocorreu: Date
}

const PresencaCultoDataSchema = object({
  status: boolean(), //Pode ter um status (presente, ausente, justificado, etc.)
  membro: string(),
  presenca_culto: string(),
});

export type PresencaCultoData = Input<typeof PresencaCultoDataSchema>;

export interface PresencaCultoParams {
  id: string;
  lider: string;
  culto: string;
}

export interface RelatorioCultosParams {
  supervisaoId: string;
  startOfInterval: string;
  endOfInterval: string;
}
