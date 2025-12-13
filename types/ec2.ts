export type EC2InstanceState =
  | "pending"
  | "running"
  | "stopping"
  | "stopped"
  | "shutting-down"
  | "terminated"
  | "unknown";

export interface EC2Status {
  instanceId: string;
  state: EC2InstanceState;
  publicIp?: string;
  privateIp?: string;
}

export interface EventBridgeRuleInfo {
  ruleName: string;
  scheduleExpression: string;
  scheduledTime: Date;
  state: "ENABLED" | "DISABLED";
}

export interface StartInstanceRequest {
  durationMinutes: number;
}

export interface StartInstanceResponse {
  success: boolean;
  message: string;
  instanceStatus?: EC2Status;
  shutdownSchedule?: EventBridgeRuleInfo;
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  instanceStatus?: EC2Status;
  activeRule?: EventBridgeRuleInfo;
  error?: string;
}

export interface StopInstanceResponse {
  success: boolean;
  message: string;
  error?: string;
}
