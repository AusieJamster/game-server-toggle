import { SignOutButton, OrganizationSwitcher } from "@clerk/nextjs";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
      <p className="mb-6 text-gray-600">
        You do not have the required permissions to access this application.
        <br />
        Please ensure you are selected into the correct organization and have Admin privileges.
      </p>
      <div className="flex gap-4 items-center">
        <OrganizationSwitcher />
        <div className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
