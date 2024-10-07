import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  createCertification,
  getCertificationByUserId,
} from "../../models/Certification";
const prisma = new PrismaClient();

export async function POST(request: NextRequest, res: NextResponse) {
  const { userId, status, application, type } = await request.json();
  if (!userId || !application || !status || !type) {
    return new Response(
      JSON.stringify({
        error: "Missing userId or application or status or type",
      }),
      { status: 400 }
    );
  }
  console.log(userId, status, application, type);
  try {
    const newCertification = createCertification(
      userId,
      type,
      status,
      application
    );
    return new NextResponse(JSON.stringify({ newCertification }), {
      status: 200,
    });
  } catch (error) {
    console.log("Custom Error creating cert:", error);
    return new NextResponse(JSON.stringify({ error: `Error creating cert` }), {
      status: 500,
    });
  }
}

export async function GET(request: NextRequest, res: NextResponse) {
    try {
        const certifications = await prisma.certification.findMany({
            include: {
              Users: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      walletAddress: true,
                      createdAt: true,
                    },
                  },
                },
                take: 1, // Get only the first UserCertification for each certification
              },
            },
          });
        console.log(certifications);
        return new NextResponse(JSON.stringify({ certifications }), {
            status: 200,
        });
    } catch (error) {
        console.log("Error fetching certifications:", error);
        return new NextResponse(JSON.stringify({ error: "Error fetching certifications" }), {
            status: 500,
        });
    }
}
