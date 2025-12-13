import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import EC2Controller from "@/components/ec2-controller";

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <div className="flex justify-end mb-4 gap-4">
        <OrganizationSwitcher />
        <UserButton />
      </div>
      <EC2Controller />
    </main>
  );
}
