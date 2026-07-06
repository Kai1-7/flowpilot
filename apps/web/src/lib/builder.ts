import {
  getTemplateBuilderDefinition,
  getTemplateDefinition,
  slugify,
  type ScheduleConfig,
  type TemplateKey,
  type TriggerType
} from "@flowpilot/shared";

export type BuilderDraft = {
  name: string;
  description: string;
  templateKey: TemplateKey;
  triggerType: TriggerType;
  schedule: ScheduleConfig | null;
  webhookSlug: string;
  retryLimit: number;
  config: Record<string, unknown>;
};

export function createBuilderDraft(templateKey: TemplateKey): BuilderDraft {
  const template = getTemplateDefinition(templateKey);
  const builder = getTemplateBuilderDefinition(templateKey);
  const triggerType = template.defaultTriggerType;

  return {
    name: builder.recommendedName,
    description: template.summary,
    templateKey,
    triggerType,
    schedule: triggerType === "scheduled" ? { intervalSeconds: 300 } : null,
    webhookSlug: triggerType === "webhook" ? slugify(builder.recommendedName) : "",
    retryLimit: template.riskLevel === "sandbox-write" ? 0 : 1,
    config: { ...template.defaultConfig }
  };
}

export function normalizeTriggerSettings(draft: BuilderDraft, triggerType: TriggerType): BuilderDraft {
  return {
    ...draft,
    triggerType,
    schedule: triggerType === "scheduled" ? draft.schedule ?? { intervalSeconds: 300 } : null,
    webhookSlug: triggerType === "webhook" ? draft.webhookSlug || slugify(draft.name) : ""
  };
}

export function setDraftConfigValue(
  draft: BuilderDraft,
  name: string,
  value: string | number | boolean | unknown[]
): BuilderDraft {
  return {
    ...draft,
    config: {
      ...draft.config,
      [name]: value
    }
  };
}

export function buildCreatePayload(draft: BuilderDraft) {
  return {
    name: draft.name,
    description: draft.description,
    templateKey: draft.templateKey,
    triggerType: draft.triggerType,
    schedule: draft.triggerType === "scheduled" ? draft.schedule : null,
    webhookSlug: draft.triggerType === "webhook" ? draft.webhookSlug : null,
    config: draft.config,
    retryLimit: draft.retryLimit
  };
}
