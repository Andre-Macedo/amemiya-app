export function atob(b64: string): string {
    return Buffer.from(b64, 'base64').toString('binary');
}

export function btoa(bin: string): string {
    return Buffer.from(bin, 'binary').toString('base64');
}

export function toByteArray(b64: string): Uint8Array {
    return new Uint8Array(Buffer.from(b64, 'base64'));
}
