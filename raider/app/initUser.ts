"use client";
import UseGetMe from "@/hooks/useGetMe";
import { useSession } from "next-auth/react";
import React from "react";

function InitUser() {
  const { status } = useSession();
  UseGetMe(status == "authenticated");
  return null;
}

export default InitUser;
