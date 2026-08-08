type TurnstileWidgetId = string;

type TurnstileRenderOptions = {
  sitekey: string;
  action: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "flexible";
  appearance?: "always" | "execute" | "interaction-only";
  callback: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

interface Window {
  turnstile?: {
    render(container: HTMLElement, options: TurnstileRenderOptions): TurnstileWidgetId;
    reset(widgetId: TurnstileWidgetId): void;
    remove(widgetId: TurnstileWidgetId): void;
  };
}
