"use client";
import { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { useRouter } from "next/navigation";
import styles from "@/styles/pages/profile.module.scss";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/account");
  }, [router]);

  return null;
}
