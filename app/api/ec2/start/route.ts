import { NextResponse } from "next/server";
import { EC2Service } from "@/lib/ec2-service";
import { EventBridgeService } from "@/lib/eventbridge-service";
import { StartInstanceRequest, StartInstanceResponse } from "@/types/ec2";

export async function POST(request: Request) {
  try {
    const body: StartInstanceRequest = await request.json();
    const { durationMinutes } = body;

    // Validate duration
    if (!durationMinutes || durationMinutes <= 0) {
      return NextResponse.json<StartInstanceResponse>(
        {
          success: false,
          message: "Invalid duration",
          error: "Duration must be a positive number",
        },
        { status: 400 }
      );
    }

    const ec2Service = new EC2Service();
    const eventBridgeService = new EventBridgeService();

    // Start the EC2 instance
    console.log(
      `Starting EC2 instance with ${durationMinutes} minute timer...`
    );
    const instanceStatus = await ec2Service.startInstance();

    // Create EventBridge rule for automatic shutdown
    console.log("Creating EventBridge shutdown schedule...");
    const shutdownSchedule = await eventBridgeService.createShutdownRule(
      durationMinutes
    );

    return NextResponse.json<StartInstanceResponse>({
      success: true,
      message: `Instance started successfully. Will auto-shutdown at ${shutdownSchedule.scheduledTime.toLocaleString()}`,
      instanceStatus,
      shutdownSchedule,
    });
  } catch (error) {
    console.error("Error in start endpoint:", error);
    return NextResponse.json<StartInstanceResponse>(
      {
        success: false,
        message: "Failed to start instance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
