import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SurveyFlow } from "@/components/survey/SurveyFlow";
import { LEGAL_CONFIG } from "@/lib/legal";
import { getSurveyDefinition } from "@/lib/survey/questions";
import type { Persona } from "@/lib/survey/types";

const personas: Persona[] = ["practitioner", "leader", "security"];

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
    openGraph: {
      title: `${definition.title} | AgentProof`,
      description: definition.description,
      url: `/survey/${persona}/`,
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
