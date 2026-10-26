import { Admin } from "@/components/Admin";
import { meta } from "@/lib/seo";

export const metadata = meta({ title: "Administration", description: "Pilotage interne.", path: "/admin/", noindex: true });
export default function Page() { return (<><div className="vhead"><div><h1>Administration</h1><p>Revenus, coûts IA, affiliation et modération.</p></div></div><Admin /></>); }
