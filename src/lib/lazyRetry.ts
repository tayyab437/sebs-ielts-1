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

      // Attempt 1 retry after 500ms
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return await componentImport();
      } catch (retryError) {
        if (!pageHasAlreadyBeenForceRefreshed) {
          // Assuming that the user is not on latest version of our application
          window.sessionStorage.setItem("page-has-been-force-refreshed", "true");
          window.location.reload();
          return { default: (() => null) as unknown as T };
        }
        // The page has already been reloaded, assuming it's a genuine error
        throw retryError;
      }
    }
  });
}
