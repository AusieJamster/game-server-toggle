# Project Agent Documentation

This document provides an overview of the **EC2 Game Server Toggle** project for AI agents and developers.

## Project Overview

This is a Next.js application designed to control an AWS EC2 instance (typically a game server) with a focus on cost management. It allows authorized users to start the server for a specific duration, after which it automatically shuts down using AWS EventBridge.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules / Global CSS (Tailwind-like utility classes in `globals.css`)
- **Authentication**: Clerk (`@clerk/nextjs`)
- **AWS SDK**: `@aws-sdk/client-ec2`, `@aws-sdk/client-eventbridge`

## Key Components

### Authentication & Authorization (`middleware.ts`)

- Uses Clerk Middleware to protect all routes.
- **RBAC**: Implements strict Role-Based Access Control.
- **Organization Check**: Verifies that the user belongs to a specific authorized organization (`CLERK_AUTHORIZED_ORG_ID`).
- **Role Check**: Verifies that the user has the `org:admin` role within that organization.

### EC2 Controller (`components/ec2-controller.tsx`)

- Main UI component.
- Polls for instance status every 10 seconds.
- Displays a countdown timer based on the scheduled shutdown time.
- Handles Start/Stop actions.

### Backend Services (`lib/`)

- **`ec2-service.ts`**: Wrapper around AWS EC2 SDK. Handles `startInstances`, `stopInstances`, and `describeInstances`.
- **`eventbridge-service.ts`**: Wrapper around AWS EventBridge SDK. Creates and manages scheduled rules to trigger the `AWS-StopEC2Instance` SSM automation document.

### API Routes (`app/api/ec2/`)

- **`start/route.ts`**: Starts the instance and creates the EventBridge shutdown rule.
- **`stop/route.ts`**: Stops the instance and deletes the EventBridge rule.
- **`status/route.ts`**: Returns current instance state and remaining time.

## Environment Variables

| Variable                            | Description                                             |
| :---------------------------------- | :------------------------------------------------------ |
| `AWS_ACCESS_KEY_ID`                 | AWS IAM User Access Key                                 |
| `AWS_SECRET_ACCESS_KEY`             | AWS IAM User Secret Key                                 |
| `AWS_REGION`                        | AWS Region (e.g., `ap-southeast-2`)                     |
| `AWS_ACCOUNT_ID`                    | AWS Account ID                                          |
| `EC2_INSTANCE_ID`                   | ID of the target EC2 instance                           |
| `EVENTBRIDGE_ROLE_ARN`              | IAM Role ARN for EventBridge to invoke SSM              |
| `EVENTBRIDGE_RULE_NAME_PREFIX`      | Prefix for created rules (default: `ec2-auto-shutdown`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Public Key                                        |
| `CLERK_SECRET_KEY`                  | Clerk Secret Key                                        |
| `CLERK_AUTHORIZED_ORG_ID`           | ID of the Clerk Organization allowed to access the app  |

## Development Workflow

1.  **Install**: `npm install`
2.  **Dev Server**: `npm run dev`
3.  **Lint**: `npm run lint`

## Important Notes

- **Security**: The application relies on server-side environment variables for AWS credentials. Never expose these to the client.
- **EventBridge**: The shutdown mechanism is decoupled from the web app. Once the rule is created, AWS handles the shutdown even if the app is offline.
