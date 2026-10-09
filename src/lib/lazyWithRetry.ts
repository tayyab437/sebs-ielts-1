import React, { lazy } from "react";

export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.warn("Retrying dynamic module load...", error);
      await new Promise((resolve) => setTimeout(resolve, 200));
      try {
        return await componentImport();
      } catch (retryError) {
        console.warn("Second retry for dynamic module load...", retryError);
        await new Promise((resolve) => setTimeout(resolve, 500));
        return await componentImport();
      }
    }
  });
}
