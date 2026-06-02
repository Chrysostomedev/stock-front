"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function ShopIdRedirect() {
  const router = useRouter();
  const params = useParams<{ shopId: string }>();
  useEffect(() => {
    const id = params?.shopId;
    router.replace(id ? `/admin/caisse?shopId=${id}` : "/admin/boutiques");
  }, []);
  return null;
}
