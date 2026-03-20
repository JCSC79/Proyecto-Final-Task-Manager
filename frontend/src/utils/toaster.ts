import { OverlayToaster, Position, type Toaster, type ToastProps } from "@blueprintjs/core";

/**
 * Singleton instance for the global notification system.
 * This follows the "Refining components" goal of Phase 3.
 * Strictly typed to avoid 'any' as per Phase 1 guidelines.
 */

let toasterInstance: Toaster | null = null;

// Initialize the toaster asynchronously for BlueprintJS v5 compatibility
const toasterPromise = typeof window !== "undefined" 
    ? OverlayToaster.create({ position: Position.TOP_RIGHT }) 
    : Promise.resolve(null);

toasterPromise.then(instance => {
    toasterInstance = instance;
});

/**
 * Proxy object to call toaster methods safely with strict typing
 */
export const AppToaster = {
    // REFINEMENT: Replaced 'any' with 'ToastProps' from @blueprintjs/core
    show: (props: ToastProps) => toasterInstance?.show(props),
    dismiss: (key: string) => toasterInstance?.dismiss(key),
    clear: () => toasterInstance?.clear(),
};