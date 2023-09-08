import { FastifyReply, FastifyRequest } from 'fastify';
import AccountRepositorie from "../Repositories/AccountRepositorie";

export interface IAccountData {
  userId: string;
  type: string;
  refresh_token: string;
  access_token: string;
  expires_at: number;
  token_type: string;
  scope: string;
  id_token: string;
  session_state: string;
}

interface IAccountParams {
  id: string;
}

class AccountController {

  // Fazendo uso do Fastify
  async index(request: FastifyRequest, reply: FastifyReply) {
    const account = await AccountRepositorie.findAll();
    if (!account) {
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
    return reply.send(account);
  }

  async show(request: FastifyRequest <{
    Params: IAccountParams }>, reply: FastifyReply) {
    const id = request.params.id
    const account = await AccountRepositorie.findById(id);
    if (!account) {
      return reply.code(404).send({ message: "Account not found!" });
    }
    return reply.code(200).send(account);
  }

  async store(request: FastifyRequest, reply: FastifyReply) {
    const accountForm = request.body as IAccountData;
    const account = await AccountRepositorie.createAccount({
      ...accountForm,
    });
    return reply.code(201).send(account);
  }

  async update(request: FastifyRequest <{
    Params: IAccountParams }>, reply: FastifyReply) {
    const id = request.params.id;
    const accountForm = request.body as IAccountData;
    const account = await AccountRepositorie.updateAccount(id, {
      ...accountForm,
    });
    return reply.code(202).send(account);
  }

  async delete(request: FastifyRequest <{
    Params: IAccountParams }>, reply: FastifyReply) {
    const id = request.params.id;
    await AccountRepositorie.deleteAccount(id);
    return reply.code(204).send();
  }

}

export default new AccountController();
