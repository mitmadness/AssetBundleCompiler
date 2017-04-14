export type SimpleLogger = (message: string) => void;

export function noopLogger(): void {
    // do nothing
}
