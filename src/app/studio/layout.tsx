import RoleGuard from "@/components/RoleGuard";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["WRITER", "ADMIN"]}>
      <div className="page-wrapper">
        <div className="container">{children}</div>
      </div>
    </RoleGuard>
  );
}
