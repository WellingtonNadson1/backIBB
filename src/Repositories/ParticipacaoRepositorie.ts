// import { PrismaClient } from "@prisma/client";
// import { ParticipacaoData } from "../Controllers/ParticipacaoController";

// const prisma = new PrismaClient();

// class ParticipacaoRepositorie {
//   async findAll() {
//     return await prisma.participacao.findMany({
//       select: {
//         id: true,
//         presente: true,
//         evento: true,
//         membro: {
//           select: {
//             id: true,
//             image_url: true,
//             email: true,
//             first_name: true,
//             last_name: true,
//             supervisao_pertence:{
//               select:{
//                   nome:true
//               }
//               },
//               celula:{
//                   select:{
//                       nome:true
//                   }
//               },
//               situacao_no_reino:{
//                   select:{
//                       nome:true
//                   }
//               },
//               cargo_de_lideranca:{
//                   select:{
//                       nome:true
//                   }
//               },
//           }
//         },

//       }
//     });
//   }

//   async findById(eventoId: string, membroId: string){
//     const participacaoExistById = await prisma.participacao.findFirst({
//       where: {
//         eventoId: eventoId,
//         userId: membroId
//       },
//       select: {
//         id: true,
//         presente: true,
//         evento: true,
//         membro: {
//           select: {
//             id: true,
//             image_url: true,
//             email: true,
//             first_name: true,
//             last_name: true,
//             supervisao_pertence:{
//               select:{
//                   nome:true
//               }
//               },
//               celula:{
//                   select:{
//                       nome:true
//                   }
//               },
//               situacao_no_reino:{
//                   select:{
//                       nome:true
//                   }
//               },
//               cargo_de_lideranca:{
//                   select:{
//                       nome:true
//                   }
//               },
//           }
//         },

//       }
//     })
//     return participacaoExistById
//   }

//   async createParticipacao(participacaoDataForm: ParticipacaoData) {
//     const { eventoId, membroId, presente } = participacaoDataForm
//     return await prisma.participacao.create({
//       data: {
//         evento: {
//           connect: {
//             id: eventoId
//           }
//       },
//       membro: {
//           connect: {
//             id: membroId
//           }
//       },
//         presente,
//       },
//     });
//   }

//   async updateParticipacao(id: string, participacaoDataForm: ParticipacaoData) {
//     const { eventoId, membroId, presente } = participacaoDataForm
//     return await prisma.participacao.update({
//       where: {
//         id: id,
//       },
//       data: {
//         evento: {
//           connect: {
//             id: eventoId
//           }
//       },
//       membro: {
//           connect: {
//             id: membroId
//           }
//       },
//         presente,
//       },
//     });
//   }

//   async deleteParticipacao(id: string) {
//     await prisma.participacao.delete({
//       where: {
//         id: id,
//       },
//     });
//   }
// }

// export default new ParticipacaoRepositorie();
