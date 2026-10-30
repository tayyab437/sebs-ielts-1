import { lazy, ComponentType, createElement } from "react";

/**
 * lazyWithRetry handles dynamic chunk loading failures due to network blips, new builds,
 * or dev-server module invalidations. It retries up to 3 times with exponential backoff,
 * and if still unable to fetch, renders a clean, non-crashing inline retry interface
 * instead of throwing an unhandled error to the top-level ErrorBoundary.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    let lastError: any = null;

    // Retry loop with progressive delays
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 400));
        }
        const module = await componentImport();
        // Clear any old recovery flags on success
        try {
          sessionStorage.removeItem("page-has-been-force-refreshed");
          sessionStorage.removeItem("chunk_retry_refreshed");
        } catch (_) {}
        return module;
      } catch (err: any) {
        lastError = err;
        console.warn(`Dynamic import attempt ${attempt + 1} failed:`, err);
      }
    }

    // If all dynamic import attempts failed, provide a graceful fallback component
    // rather than crashing the React tree
    console.error("Dynamic import completely failed after retries:", lastError);

    const FallbackComponent = (() => {
      return createElement(
        "div",
        {
          className:
            "min-h-[50vh] flex flex-col items-center justify-center p-6 text-center select-none",
        },
        createElement(
          "div",
          {
            className:
              "max-w-md w-full bg-card border border-border/60 rounded-2xl p-6 shadow-lg space-y-4",
          },
          createElement(
            "div",
            {
              className:
                "w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold",
            },
            "!"
          ),
          createElement(
            "h2",
            { className: "text-lg font-bold text-foreground" },
            "Module Temporarily Unavailable"
          ),
          createElement(
            "p",
            { className: "text-xs text-muted-foreground" },
            "The requested page module could not be loaded. Please refresh or return to the main page."
          ),
          createElement(
            "div",
            { className: "flex gap-2 justify-center pt-2" },
            createElement(
              "button",
              {
                onClick: () => window.location.reload(),
                className:
                  "px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition",
              },
              "Reload Page"
            ),
            createElement(
              "button",
              {
                onClick: () => {
                  window.location.href = "/";
                },
                className:
                  "px-4 py-2 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition",
              },
              "Return Home"
            )
          )
        )
      );
    }) as unknown as T;

    return { default: FallbackComponent };
  });
}

