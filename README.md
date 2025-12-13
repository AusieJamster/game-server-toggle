# EC2 Game Server Toggle

A Next.js TypeScript application for controlling AWS EC2 instances with automatic scheduled shutdown using EventBridge.

## Features

- 🚀 Start EC2 instances with a single click
- ⏱️ Automatic shutdown via AWS EventBridge
- ⏰ Real-time countdown timer
- 📊 Live instance status monitoring
- 🎨 Modern, responsive UI with smooth animations
- 🔒 Secure AWS SDK integration

## Prerequisites

- Node.js 18+ installed
- AWS Account with appropriate permissions
- EC2 instance already created

## AWS IAM Permissions Required

Your AWS credentials need the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "events:PutRule",
        "events:PutTargets",
        "events:DeleteRule",
        "events:RemoveTargets",
        "events:ListRules",
        "events:DescribeRule"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::*:role/*"
    }
  ]
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# EC2 Configuration
EC2_INSTANCE_ID=i-0123456789abcdef0

# EventBridge Configuration
EVENTBRIDGE_RULE_NAME_PREFIX=ec2-auto-shutdown
EVENTBRIDGE_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_EVENTBRIDGE_ROLE
```

**Important:** Replace the placeholder values with your actual AWS credentials and EC2 instance ID.

### 3. EventBridge IAM Role

You need to create an IAM role for EventBridge to stop your EC2 instances. Here's how:

1. Go to AWS IAM Console
2. Create a new role
3. Select "EventBridge" as the trusted entity
4. Attach a policy with EC2 stop permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StopInstances",
        "ssm:StartAutomationExecution"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Copy the role ARN and add it to your `.env.local` as `EVENTBRIDGE_ROLE_ARN`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Select Duration**: Choose how long you want the server to run (30 min, 1 hour, 2 hours, 4 hours, or 8 hours)
2. **Start Server**: Click the "Start Server" button
3. **Monitor Status**: Watch the countdown timer and instance status
4. **Automatic Shutdown**: The server will automatically stop when the timer expires
5. **Manual Stop** (optional): Click "Stop Server" to shut down before the timer expires

## Architecture

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Backend**: Next.js API Routes
- **AWS Services**:
  - EC2 for instance management
  - EventBridge for scheduled shutdowns
- **Styling**: Custom CSS with modern design system

## How It Works

1. When you start the server, the application:

   - Starts the EC2 instance via AWS SDK
   - Creates an EventBridge rule with a cron expression for the shutdown time
   - Configures the rule to trigger EC2 stop action

2. EventBridge ensures:

   - Shutdown happens even if the web app restarts
   - Reliable execution managed by AWS
   - No long-running processes needed

3. The UI polls for status every 10 seconds and updates the countdown timer in real-time

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Security Notes

- Never commit `.env.local` to version control
- Use IAM roles with minimum required permissions
- Consider implementing authentication for production use
- Protect your application with network-level security (VPC, firewall rules)

## License

MIT
