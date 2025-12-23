const prismaUnavailable = () => {
  throw new Error("Prisma is not configured in this project. Use Drizzle (lib/db.ts) instead.");
};

export const prisma = new Proxy(
  {},
  {
    get() {
      return prismaUnavailable;
    },
  }
) as unknown;
