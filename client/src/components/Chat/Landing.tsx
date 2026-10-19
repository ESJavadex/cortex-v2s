import { useMemo } from 'react';
import { Activity, ArrowUpRight, BookOpen, Network } from 'lucide-react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useChatContext, useAgentsMapContext, useAssistantsMapContext } from '~/Providers';
import { useGetEndpointsQuery } from '~/data-provider';
import CortexBrand from '~/components/Brand/CortexBrand';
import { useLocalize, useSubmitMessage } from '~/hooks';
import { getIconEndpoint, getEntity } from '~/utils';

const workflows = [
  {
    icon: Activity,
    title: 'com_ui_cortex_triage',
    description: 'com_ui_cortex_triage_description',
    prompt: 'com_ui_cortex_triage_prompt',
  },
  {
    icon: Network,
    title: 'com_ui_cortex_infra',
    description: 'com_ui_cortex_infra_description',
    prompt: 'com_ui_cortex_infra_prompt',
  },
  {
    icon: BookOpen,
    title: 'com_ui_cortex_runbook',
    description: 'com_ui_cortex_runbook_description',
    prompt: 'com_ui_cortex_runbook_prompt',
  },
] as const;

export default function Landing({ centerFormOnLanding }: { centerFormOnLanding: boolean }) {
  const localize = useLocalize();
  const { conversation } = useChatContext();
  const agentsMap = useAgentsMapContext();
  const assistantMap = useAssistantsMapContext();
  const { submitMessage } = useSubmitMessage();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const endpoint = useMemo(
    () =>
      getIconEndpoint({
        endpointsConfig,
        iconURL: conversation?.iconURL,
        endpoint:
          conversation?.endpoint === EModelEndpoint.azureOpenAI
            ? EModelEndpoint.openAI
            : (conversation?.endpoint ?? ''),
      }),
    [conversation?.endpoint, conversation?.iconURL, endpointsConfig],
  );
  const { entity } = getEntity({
    endpoint,
    agentsMap,
    assistantMap,
    agent_id: conversation?.agent_id,
    assistant_id: conversation?.assistant_id,
  });

  return (
    <section
      className={`cortex-landing ${centerFormOnLanding ? 'cortex-landing-centered' : ''}`}
      aria-labelledby="cortex-welcome"
    >
      <div className="cortex-workspace-label">
        <span className="cortex-status-dot" />
        {localize('com_ui_cortex_workspace')}
      </div>
      <CortexBrand />
      <h1 id="cortex-welcome">{entity?.name || localize('com_ui_cortex_welcome')}</h1>
      <p className="cortex-welcome-description">
        {entity?.description ||
          conversation?.greeting ||
          localize('com_ui_cortex_welcome_description')}
      </p>
      <div className="cortex-workflows">
        {workflows.map(({ icon: Icon, title, description, prompt }) => (
          <button
            type="button"
            key={title}
            className="cortex-workflow"
            onClick={() => submitMessage({ text: localize(prompt) })}
          >
            <span className="cortex-workflow-top">
              <Icon size={20} aria-hidden="true" />
              <ArrowUpRight size={16} aria-hidden="true" />
            </span>
            <strong>{localize(title)}</strong>
            <span>{localize(description)}</span>
          </button>
        ))}
      </div>
      <p className="cortex-demo-label">{localize('com_ui_cortex_demo_notice')}</p>
    </section>
  );
}
