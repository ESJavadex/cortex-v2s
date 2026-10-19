import { useLocalize } from '~/hooks';

export default function CortexBrand({ compact = false }: { compact?: boolean }) {
  const localize = useLocalize();
  return (
    <div className="cortex-brand" aria-label={localize('com_ui_cortex_brand')}>
      <img src="assets/cortex-mark.svg" alt="" width={40} height={40} />
      {!compact && <span>{localize('com_ui_cortex_brand')}</span>}
    </div>
  );
}
