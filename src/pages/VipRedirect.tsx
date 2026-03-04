import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

/**
 * VIP referral landing page.
 * Stores the referral code in localStorage and redirects to signup.
 */
export default function VipRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem("referral_code", code);
    }
    navigate("/signup", { replace: true });
  }, [code, navigate]);

  return null;
}
