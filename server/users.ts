"use server";

import { auth } from "@/lib/auth";

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      success: true,
      message: "Signed in successfully",
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || "An unknown error occurred",
    };
  }
};

export const signUp = async () => {
  await auth.api.signUpEmail({
    body: {
      email: "admin@admin.com",
      password: "12345678",
      name: "Admin",
    },
  });
};
