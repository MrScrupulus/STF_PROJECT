import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage({ params }) {
  return <VerifyEmailClient token={params.token} />;
}
