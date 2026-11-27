import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoleBrief } from "@/components/interviews/RoleBrief";
import { ROLES, roleSlug } from "@/data/roles";

type Params = { params: Promise<{ role: string }> };

const findRole = (slug: string) => ROLES.find((r) => roleSlug(r.title) === slug);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const role = findRole((await params).role);
  return { title: role ? `${role.title} interview · DevPrep` : "Interview · DevPrep" };
}

export default async function RolePage({ params }: Params) {
  const { role: slug } = await params;
  if (!findRole(slug)) notFound();
  return <RoleBrief slug={slug} />;
}
