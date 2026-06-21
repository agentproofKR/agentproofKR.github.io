import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SurveyFlow } from "@/components/survey/SurveyFlow";
import { LEGAL_CONFIG } from "@/lib/legal";
import { getSurveyDefinition } from "@/lib/survey/questions";
import type { Persona } from "@/lib/survey/types";

const personas: Persona[] = ["practitioner", "leader", "security"];
const ogImage = {
  url: "/og-agentproof.png",
  width: 1200,
  height: 630,
  alt: "AgentProof AI 안전 체크 화면",
} as const;

export const dynamicParams = false;

type PersonaPageProps = {
  params: Promise<{ persona: string }>;
};

export function generateStaticParams() {
  return personas.map((persona) => ({ persona }));
}

export async function generateMetadata({ params }: PersonaPageProps): Promise<Metadata> {
  const { persona } = await params;
  if (!isPersona(persona)) {
    return {};
  }
  const definition = getSurveyDefinition(persona);
  return {
    title: `${definition.title} | AgentProof`,
    description: definition.description,
    alternates: {
      canonical: `/survey/${persona}/`,
    },
    openGraph: {
      title: `${definition.title} | AgentProof`,
      description: definition.description,
      url: `/survey/${persona}/`,
      images: [ogImage],
    },
  };
}

export default async function PersonaSurveyPage({ params }: PersonaPageProps) {
  const { persona } = await params;
  if (!isPersona(persona)) {
    notFound();
  }
  return <SurveyFlow persona={persona} legalOperatorName={LEGAL_CONFIG.operatorName} />;
}

function isPersona(value: string): value is Persona {
  return personas.includes(value as Persona);
}
