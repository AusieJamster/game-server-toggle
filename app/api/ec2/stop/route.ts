import { NextResponse } from "next/server";
import { EC2Service } from "@/lib/ec2-service";
import { EventBridgeService } from "@/lib/eventbridge-service";
import { StopInstanceResponse } from "@/types/ec2";

export async function POST() {
  try {
    const ec2Service = new EC2Service();
    const eventBridgeService = new EventBridgeService();

    // Stop the EC2 instance
    console.log("Stopping EC2 instance...");
    await ec2Service.stopInstance();

    // Delete any EventBridge rules
    console.log("Deleting EventBridge rules...");
    await eventBridgeService.deleteExistingRules();

    return NextResponse.json<StopInstanceResponse>({
      success: true,
      message: "Instance stopped successfully",
    });
  } catch (error) {
    console.error("Error in stop endpoint:", error);
    return NextResponse.json<StopInstanceResponse>(
      {
        success: false,
        message: "Failed to stop instance",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
