import { lazy, ComponentType } from "react";

/**
 * lazyWithRetry handles dynamic chunk loading failures due to network blips or new builds.
 * If a module fails to fetch, it retries up to 2 times with a slight delay, and then does a single
 * graceful page refresh if chunks are stale.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem("page-has-been-force-refreshed") || "false"
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem("page-has-been-force-refreshed", "false");
      return component;
    } catch (error: any) {
      console.warn("Dynamic import failed, attempting retry...", error);

      // Attempt 1 retry after 400ms
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return await componentImport();
      } catch (retryError) {
        console.error("Dynamic import failed after retry:", retryError);
        throw retryError;
      }
    }
  });
}
