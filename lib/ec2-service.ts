import {
  EC2Client,
  StartInstancesCommand,
  StopInstancesCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { EC2Status, EC2InstanceState } from "@/types/ec2";

export class EC2Service {
  private client: EC2Client;
  private instanceId: string;

  constructor() {
    this.client = new EC2Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.instanceId = process.env.EC2_INSTANCE_ID!;
  }

  async startInstance(): Promise<EC2Status> {
    try {
      const command = new StartInstancesCommand({
        InstanceIds: [this.instanceId],
      });

      await this.client.send(command);
      console.log(`Started EC2 instance: ${this.instanceId}`);

      // Return current status
      return await this.getInstanceStatus();
    } catch (error) {
      console.error("Error starting EC2 instance:", error);
      throw new Error(`Failed to start instance: ${error}`);
    }
  }

  async stopInstance(): Promise<EC2Status> {
    try {
      const command = new StopInstancesCommand({
        InstanceIds: [this.instanceId],
      });

      await this.client.send(command);
      console.log(`Stopped EC2 instance: ${this.instanceId}`);

      return await this.getInstanceStatus();
    } catch (error) {
      console.error("Error stopping EC2 instance:", error);
      throw new Error(`Failed to stop instance: ${error}`);
    }
  }

  async getInstanceStatus(): Promise<EC2Status> {
    try {
      const command = new DescribeInstancesCommand({
        InstanceIds: [this.instanceId],
      });

      const response = await this.client.send(command);
      const instance = response.Reservations?.[0]?.Instances?.[0];

      if (!instance) {
        throw new Error("Instance not found");
      }

      const state = (instance.State?.Name as EC2InstanceState) || "unknown";

      return {
        instanceId: this.instanceId,
        state,
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
      };
    } catch (error) {
      console.error("Error getting instance status:", error);
      throw new Error(`Failed to get instance status: ${error}`);
    }
  }
}
