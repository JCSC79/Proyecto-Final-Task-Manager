import { OverlayToaster, Position, type Toaster, type ToastProps } from "@blueprintjs/core";

/**
 * Singleton instance for the global notification system.
 * This follows the "Refining components" goal of Phase 3.
 * Strictly typed to avoid 'any' as per Phase 1 guidelines.
 */

let toasterInstance: Toaster | null = null;

// Initialize the toaster asynchronously for BlueprintJS v5 compatibility
const toasterPromise = globalThis.window === undefined
    ? Promise.resolve(null)
    : OverlayToaster.create({ position: Position.TOP_RIGHT });

toasterInstance = await toasterPromise;

/**
 * Proxy object to call toaster methods safely with strict typing
 */
export const AppToaster = {
    // REFINEMENT: Replaced 'any' with 'ToastProps' from @blueprintjs/core
    show: (props: ToastProps) => toasterInstance?.show({ timeout: 1800, ...props }),
    dismiss: (key: string) => toasterInstance?.dismiss(key),
    clear: () => toasterInstance?.clear(),
};