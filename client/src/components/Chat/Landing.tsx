import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { EModelEndpoint } from 'librechat-data-provider';
import { Activity, ArrowUpRight, BookOpen, Network } from 'lucide-react';
import { useChatContext, useAgentsMapContext, useAssistantsMapContext } from '~/Providers';
import { useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import { useLocalize, useSubmitMessage, useAuthContext } from '~/hooks';
import { getIconEndpoint, getEntity, getModelSpec } from '~/utils';
import AgentContact from '~/components/Agents/AgentContact';
import CortexBrand from '~/components/Brand/CortexBrand';
import Description from '~/components/ui/Description';
import temporaryStore from '~/store/temporary';

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
  const { user } = useAuthContext();
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
  const { data: startupConfig } = useGetStartupConfig();
  const isTemporary = useRecoilValue(temporaryStore.isTemporary);
  const { entity, isAgent } = getEntity({
    endpoint,
    agentsMap,
    assistantMap,
    agent_id: conversation?.agent_id,
    assistant_id: conversation?.assistant_id,
  });

  const modelSpec = useMemo(
    () => getModelSpec({ specName: conversation?.spec, startupConfig }),
    [conversation?.spec, startupConfig],
  );
  const customWelcome = startupConfig?.interface?.customWelcome;
  const resolvedWelcome =
    typeof customWelcome === 'string' && user?.name
      ? customWelcome.replace(/{{user.name}}/g, user.name)
      : customWelcome;
  const title = isTemporary
    ? localize('com_ui_temporary')
    : entity?.name ||
      (modelSpec?.showOnLanding && modelSpec.label) ||
      (typeof resolvedWelcome === 'string' && resolvedWelcome) ||
      localize('com_ui_cortex_welcome');
  const description = isTemporary
    ? localize('com_ui_temporary_description')
    : entity?.description ||
      (modelSpec?.showOnLanding && modelSpec.description) ||
      conversation?.greeting ||
      localize('com_ui_cortex_welcome_description');
  const selectedAgent =
    isAgent && conversation?.agent_id != null ? agentsMap?.[conversation.agent_id] : undefined;

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
      <h1 id="cortex-welcome">{title}</h1>
      <Description allowMedia description={description} className="cortex-welcome-description" />
      {selectedAgent && !isTemporary && (
        <AgentContact agent={selectedAgent} className="mb-4 justify-center text-sm" />
      )}
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
