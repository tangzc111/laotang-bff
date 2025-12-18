import type { PrismaClient } from '@prisma/client';

export default class UserService {
  private prismaWriteClient: PrismaClient;
  private prismaReadClient: PrismaClient;

  constructor({
    prismaWriteClient,
    prismaReadClient,
  }: { prismaWriteClient: PrismaClient; prismaReadClient: PrismaClient }) {
    this.prismaWriteClient = prismaWriteClient;
    this.prismaReadClient = prismaReadClient;
  }

  async createUser(email: string, name?: string) {
    return await this.prismaWriteClient.user.create({
      data: {
        email,
        name,
      },
    });
  }

  async findUserByEmail(email: string) {
    return await this.prismaReadClient.user.findUnique({
      where: { email },
    });
  }

  async getAllUsers() {
    return await this.prismaReadClient.user.findMany();
  }

  async updateUser(id: string, data: { name?: string; email?: string }) {
    return await this.prismaWriteClient.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    return await this.prismaWriteClient.user.delete({
      where: { id },
    });
  }
}
