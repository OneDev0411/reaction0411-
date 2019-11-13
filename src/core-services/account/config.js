import envalid from "envalid";

const { str } = envalid;

export default envalid.cleanEnv(process.env, {
  HYDRA_OAUTH2_INTROSPECT_URL: str({ devDefault: "http://hydra:4445/oauth2/introspect" }),
  REACTION_IDENTITY_PUBLIC_PASSWORD_RESET_URL: str({ devDefault: "http://localhost:4100/reset-password/TOKEN" }),
  REACTION_IDENTITY_PUBLIC_VERIFY_EMAIL_URL: str({ devDefault: "http://localhost:4100/#/verify-email/TOKEN" }),
  REACTION_ADMIN_PUBLIC_ACCOUNT_REGISTRATION_URL: str({ devDefault: "http://localhost:4080" })
});
