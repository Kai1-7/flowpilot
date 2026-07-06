import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { TemplateKeySchema, type TemplateKey } from "@flowpilot/shared";
import { BuilderReviewPanel } from "../components/BuilderReviewPanel";
import { BuilderStepper } from "../components/BuilderStepper";
import { TemplateChoiceGrid } from "../components/TemplateChoiceGrid";
import { TemplateConfigForm } from "../components/TemplateConfigForm";
import { TriggerSettingsForm } from "../components/TriggerSettingsForm";
import { api } from "../lib/api";
import { buildCreatePayload, createBuilderDraft, type BuilderDraft } from "../lib/builder";

function templateFromSearch(value: string | null): TemplateKey {
  const parsed = TemplateKeySchema.safeParse(value);
  return parsed.success ? parsed.data : "api-health-check";
}

export function AutomationBuilderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initialTemplate = useMemo(() => templateFromSearch(searchParams.get("template")), [searchParams]);
  const [draft, setDraft] = useState<BuilderDraft>(() => createBuilderDraft(initialTemplate));

  const templatesQuery = useQuery({
    queryKey: ["templates"],
    queryFn: api.templates
  });

  const validationQuery = useQuery({
    queryKey: ["template-validation", draft.templateKey, draft.config],
    queryFn: () => api.validateTemplate(draft.templateKey, draft.config),
    retry: false
  });

  const createMutation = useMutation({
    mutationFn: () => api.createAutomation(buildCreatePayload(draft)),
    onSuccess: async ({ automation }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["automations"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
      navigate(`/automations/${automation.id}`);
    }
  });

  const validationStatus = validationQuery.isFetching
    ? "pending"
    : validationQuery.isError
      ? "invalid"
      : validationQuery.data?.ok
        ? "valid"
        : "idle";

  if (templatesQuery.isLoading) return <div className="rounded-lg bg-white p-6 shadow-sm">Loading builder...</div>;
  if (templatesQuery.error) {
    return <div className="rounded-lg bg-rose-50 p-6 text-rose-700">{(templatesQuery.error as Error).message}</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <Link to="/automations" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-950">
          <ArrowLeft size={16} />
          Automations
        </Link>
        <h1 className="text-2xl font-bold text-zinc-950">New automation</h1>
        <p className="mt-1 text-sm text-zinc-600">Create a validated workflow from a safe local template.</p>
      </div>

      <BuilderStepper currentStep={validationStatus === "valid" ? 3 : 2} />

      <TemplateChoiceGrid
        templates={templatesQuery.data?.templates ?? []}
        selectedKey={draft.templateKey}
        onSelect={(templateKey) => setDraft(createBuilderDraft(templateKey))}
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-5">
          <TriggerSettingsForm draft={draft} onChange={setDraft} />
          <TemplateConfigForm draft={draft} onChange={setDraft} />
        </div>
        <BuilderReviewPanel
          draft={draft}
          validationStatus={validationStatus}
          validationError={validationQuery.error ? (validationQuery.error as Error).message : null}
          isCreating={createMutation.isPending}
          onCreate={() => createMutation.mutate()}
        />
      </section>
    </div>
  );
}
