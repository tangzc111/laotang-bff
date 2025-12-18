import type { PrismaClient, User } from '@prisma/client';

type UserId = User['id'];

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

  async createUser(email: string, name?: string): Promise<User> {
    return await this.prismaWriteClient.user.create({
      data: {
        email,
        name,
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prismaReadClient.user.findUnique({
      where: { email },
    });
  }

  async getAllUsers(): Promise<User[]> {
    return await this.prismaReadClient.user.findMany();
  }

  async updateUser(id: UserId, data: { name?: string; email?: string }): Promise<User> {
    return await this.prismaWriteClient.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: UserId): Promise<User> {
    return await this.prismaWriteClient.user.delete({
      where: { id },
    });
  }
}
