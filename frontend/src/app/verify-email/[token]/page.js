import { use } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage({ params }) {
  const resolvedParams = use(Promise.resolve(params));
  return <VerifyEmailClient token={resolvedParams.token} />;
}
