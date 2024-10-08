import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getCertificationByUserId,
} from "@/app/models/Certification";

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
  ) {
    const { userId } = params;
  
  
    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Missing userId",
        }),
        { status: 400 }
      );
    }
  
    try {
      const certifications = await getCertificationByUserId(Number(userId));
      return new NextResponse(JSON.stringify({ certifications }), {
        status: 200,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: `Error retrieving certs` }), {
        status: 500,
      });
    }
  }
  