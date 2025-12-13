import { NextResponse } from "next/server";
import { EC2Service } from "@/lib/ec2-service";
import { EventBridgeService } from "@/lib/eventbridge-service";
import { StatusResponse } from "@/types/ec2";

export async function GET() {
  try {
    const ec2Service = new EC2Service();
    const eventBridgeService = new EventBridgeService();

    // Get instance status
    const instanceStatus = await ec2Service.getInstanceStatus();

    // Get active EventBridge rule
    const activeRule = await eventBridgeService.getActiveRule();

    return NextResponse.json<StatusResponse>({
      success: true,
      instanceStatus,
      activeRule: activeRule || undefined,
    });
  } catch (error) {
    console.error("Error in status endpoint:", error);
    return NextResponse.json<StatusResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
