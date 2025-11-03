import ActivateClient from "./ActivateClient";

export default async function ActivateAccountPage({
  params,
}: {
  readonly params: Promise<{ readonly token: string }>;
}) {
  const { token } = await params;
  return <ActivateClient token={decodeURIComponent(token)} />;
}
