// import { IAccountData } from "../Controllers/AccountController";
// import { createPrismaInstance } from "../services/prisma";

// const prisma = createPrismaInstance()


// class AccountRepositorie {
//   async findAll() {
//     return await prisma.account.findMany({
//       select: {
//         id: true,
//         user: {
//           select: {
//             first_name: true,
//             id: true,
//           },
//         },
//       },
//     });
//   }

//   async findById(id: string) {
//     return await prisma.account.findUnique({
//       where: {
//         id: id,
//       },
//     });
//   }

//   async createAccount(accountDataForm: IAccountData) {
//     const {
//       userId,
//       type,
//       refresh_token,
//       access_token,
//       expires_at,
//       token_type,
//       scope,
//       id_token,
//       session_state,
//     } = accountDataForm;
//     return await prisma.account.create({
//       data: {
//         userId,
//         type,
//         refresh_token,
//         access_token,
//         expires_at,
//         token_type,
//         scope,
//         id_token,
//         session_state,
//       },
//     });
//   }

//   async updateAccount(id: string, accountDataForm: IAccountData) {
//     const {
//       userId,
//       type,
//       refresh_token,
//       access_token,
//       expires_at,
//       token_type,
//       scope,
//       id_token,
//       session_state,
//     } = accountDataForm;
//     return await prisma.account.update({
//       where: {
//         id: id,
//       },
//       data: {
//         userId,
//         type,
//         refresh_token,
//         access_token,
//         expires_at,
//         token_type,
//         scope,
//         id_token,
//         session_state,
//       },
//     });
//   }

//   async deleteAccount(id: string) {
//     return await prisma.account.delete({
//       where: {
//         id: id,
//       },
//     });
//   }
// }

// export default new AccountRepositorie();
