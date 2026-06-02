import ShopIdRedirect from "./ShopIdRedirect";

// output: export exige au moins une valeur — on pré-génère un placeholder.
// La vraie caisse admin se trouve à /admin/caisse?shopId=xxx (query param).
export function generateStaticParams() {
  return [{ shopId: "_" }];
}

export default function Page() {
  return <ShopIdRedirect />;
}
