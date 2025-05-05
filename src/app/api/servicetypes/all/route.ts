import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";

// Define a ServiceType interface to match the Prisma model
interface ServiceType {
  id: string;
  name: string;
  code: string;
  serviceId: string;
  service: {
    name: string;
    code: string;
  } | null;
}

export async function GET(_req: NextRequest) {
  try {
    const serviceTypes =
      await prisma.serviceType.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          service: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      });

    return NextResponse.json(
      serviceTypes.map((type: ServiceType) => ({
        id: type.id,
        name: type.name,
        code: type.code,
        serviceId: type.serviceId,
        serviceName: type.service
          ? type.service.name
          : "Unknown Service",
      }))
    );
  } catch (error) {
    console.error(
      "Error fetching service types:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch service types" },
      { status: 500 }
    );
  }
}
