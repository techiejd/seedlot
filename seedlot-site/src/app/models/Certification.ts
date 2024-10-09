import { PrismaClient } from "@prisma/client";
import { InputJsonValue } from "@prisma/client/runtime/library";

const prisma = new PrismaClient();

type Certification = {
  id: number;
  type: string;
  status: string;
  application: string;
  createdAt: Date;
};

export async function get(userId: number) {
  let certification;

  try {
    certification = await prisma.certification.findFirst({
      where: {
        Users: {
          some: {
            userId: userId,
          },
        },
      },
    });
    return certification;
  } catch (error) {
    console.error("Error fetching certification data:", error);
    throw new Error("Unable to fetch certification data");
  } finally {
    await prisma.$disconnect(); // Ensure the client is disconnected regardless of success or failure
  }
}

export async function createCertification(
  userId: number,
  type: string,
  status: string,
  application: InputJsonValue
) {
  let certification;
  try {

    certification = await prisma.certification.create({
      data: {
        type: type,
        status: status,
        application: application,
      },
    });

    console.log("Certification created:", certification);

    await prisma.userCertification.create({
      data: {
        userId: userId,
        certificationId: certification.id,
      },
    });

    
    return certification;
  } catch (error) {
    console.error("Error creating certification:", error);
    throw new Error("Unable to create certification");
  } finally {
    await prisma.$disconnect(); // Ensure the client is disconnected regardless of success or failure
  }
}
