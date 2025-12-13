import {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand,
  DeleteRuleCommand,
  RemoveTargetsCommand,
  ListRulesCommand,
  DescribeRuleCommand,
} from "@aws-sdk/client-eventbridge";
import { EventBridgeRuleInfo } from "@/types/ec2";

export class EventBridgeService {
  private client: EventBridgeClient;
  private ruleNamePrefix: string;
  private instanceId: string;

  constructor() {
    this.client = new EventBridgeClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.ruleNamePrefix =
      process.env.EVENTBRIDGE_RULE_NAME_PREFIX || "ec2-auto-shutdown";
    this.instanceId = process.env.EC2_INSTANCE_ID!;
  }

  async createShutdownRule(
    durationMinutes: number
  ): Promise<EventBridgeRuleInfo> {
    try {
      // First, delete any existing rules
      await this.deleteExistingRules();

      const ruleName = `${this.ruleNamePrefix}-${Date.now()}`;
      const scheduledTime = new Date(Date.now() + durationMinutes * 60 * 1000);

      // Convert to cron expression (UTC)
      const cronExpression = this.createCronExpression(scheduledTime);

      // Create the rule
      const putRuleCommand = new PutRuleCommand({
        Name: ruleName,
        ScheduleExpression: cronExpression,
        State: "ENABLED",
        Description: `Auto-shutdown for EC2 instance ${
          this.instanceId
        } at ${scheduledTime.toISOString()}`,
      });

      await this.client.send(putRuleCommand);
      console.log(`Created EventBridge rule: ${ruleName}`);

      // Add target to stop the EC2 instance using Systems Manager Automation
      const putTargetsCommand = new PutTargetsCommand({
        Rule: ruleName,
        Targets: [
          {
            Id: "1",
            Arn: `arn:aws:ssm:${process.env.AWS_REGION}::automation-definition/AWS-StopEC2Instance:$DEFAULT`,
            RoleArn: process.env.EVENTBRIDGE_ROLE_ARN,
            Input: JSON.stringify({
              InstanceId: [this.instanceId],
            }),
          },
        ],
      });

      await this.client.send(putTargetsCommand);
      console.log(`Added target to rule: ${ruleName}`);

      return {
        ruleName,
        scheduleExpression: cronExpression,
        scheduledTime,
        state: "ENABLED",
      };
    } catch (error) {
      console.error("Error creating EventBridge rule:", error);
      throw new Error(`Failed to create shutdown schedule: ${error}`);
    }
  }

  async deleteExistingRules(): Promise<void> {
    try {
      const listCommand = new ListRulesCommand({
        NamePrefix: this.ruleNamePrefix,
      });

      const response = await this.client.send(listCommand);
      const rules = response.Rules || [];

      for (const rule of rules) {
        if (rule.Name) {
          await this.deleteRule(rule.Name);
        }
      }

      console.log(`Deleted ${rules.length} existing rule(s)`);
    } catch (error) {
      console.error("Error deleting existing rules:", error);
      // Don't throw - we can continue even if delete fails
    }
  }

  async deleteRule(ruleName: string): Promise<void> {
    try {
      // Remove targets first
      const removeTargetsCommand = new RemoveTargetsCommand({
        Rule: ruleName,
        Ids: ["1"],
      });
      await this.client.send(removeTargetsCommand);

      // Then delete the rule
      const deleteRuleCommand = new DeleteRuleCommand({
        Name: ruleName,
      });
      await this.client.send(deleteRuleCommand);

      console.log(`Deleted rule: ${ruleName}`);
    } catch (error) {
      console.error(`Error deleting rule ${ruleName}:`, error);
      throw error;
    }
  }

  async getActiveRule(): Promise<EventBridgeRuleInfo | null> {
    try {
      const listCommand = new ListRulesCommand({
        NamePrefix: this.ruleNamePrefix,
      });

      const response = await this.client.send(listCommand);
      const rules = response.Rules || [];

      if (rules.length === 0) {
        return null;
      }

      // Get the most recent rule
      const latestRule = rules[0];
      if (!latestRule.Name) {
        return null;
      }

      const describeCommand = new DescribeRuleCommand({
        Name: latestRule.Name,
      });

      const ruleDetails = await this.client.send(describeCommand);

      if (!ruleDetails.ScheduleExpression) {
        return null;
      }

      const scheduledTime = this.parseCronExpression(
        ruleDetails.ScheduleExpression
      );

      return {
        ruleName: latestRule.Name,
        scheduleExpression: ruleDetails.ScheduleExpression,
        scheduledTime,
        state: (ruleDetails.State as "ENABLED" | "DISABLED") || "DISABLED",
      };
    } catch (error) {
      console.error("Error getting active rule:", error);
      return null;
    }
  }

  private createCronExpression(date: Date): string {
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();
    const dayOfMonth = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getUTCFullYear();

    // EventBridge cron format: cron(minutes hours day month ? year)
    return `cron(${minutes} ${hours} ${dayOfMonth} ${month} ? ${year})`;
  }

  private parseCronExpression(cronExpression: string): Date {
    try {
      // Parse: cron(minutes hours day month ? year)
      const match = cronExpression.match(
        /cron\((\d+) (\d+) (\d+) (\d+) \? (\d+)\)/
      );
      if (!match) {
        return new Date();
      }

      const [, minutes, hours, day, month, year] = match;
      return new Date(
        Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes)
        )
      );
    } catch (error) {
      console.error("Error parsing cron expression:", error);
      return new Date();
    }
  }
}
