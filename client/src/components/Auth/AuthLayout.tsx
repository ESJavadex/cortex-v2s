import { ThemeSelector } from '@librechat/client';
import type { TStartupConfig } from 'librechat-data-provider';
import type { TranslationKeys } from '~/hooks';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import CortexBrand from '~/components/Brand/CortexBrand';
import SocialLoginRender from './SocialLoginRender';
import { useLocalize } from '~/hooks';
import { Banner } from '../Banners';
import Footer from './Footer';

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a className="font-semibold text-green-600 hover:underline" href="/forgot-password">
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="cortex-auth relative flex min-h-screen flex-col">
      <Banner />
      <main className="cortex-auth-grid flex-grow">
        <section className="cortex-auth-story" aria-label={localize('com_ui_cortex_workspace')}>
          <CortexBrand />
          <div className="cortex-story-copy">
            <span className="cortex-eyebrow">{localize('com_ui_cortex_workspace')}</span>
            <h2>{localize('com_ui_cortex_auth_title')}</h2>
            <p>{localize('com_ui_cortex_auth_description')}</p>
            <div className="cortex-capabilities">
              <span>{localize('com_ui_cortex_monitoring')}</span>
              <span>{localize('com_ui_cortex_knowledge')}</span>
              <span>{localize('com_ui_cortex_resolution')}</span>
            </div>
          </div>
          <div className="cortex-auth-note">
            <span className="cortex-status-dot" />
            {localize('com_ui_cortex_demo_notice')}
          </div>
        </section>
        <section className="cortex-auth-access">
          <div className="cortex-auth-card">
            <div className="cortex-mobile-brand">
              <CortexBrand />
            </div>
            <span className="cortex-eyebrow">{localize('com_ui_cortex_access')}</span>
            <DisplayError />
            {!hasStartupConfigError && !isFetching && header && (
              <h1 className="mb-4 mt-3 text-3xl font-semibold text-text-primary">{header}</h1>
            )}
            {children}
            {!pathname.includes('2fa') &&
              (pathname.includes('login') || pathname.includes('register')) && (
                <SocialLoginRender startupConfig={startupConfig} />
              )}
          </div>
          <Footer startupConfig={startupConfig} />
        </section>
      </main>
      <div className="absolute bottom-0 right-0 m-4">
        <ThemeSelector />
      </div>
    </div>
  );
}

export default AuthLayout;
