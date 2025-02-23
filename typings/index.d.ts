export declare function setOptions(_options: Options): void;
export declare class Collider {
    private pos;
    private anchor;
    private size;
    private pixelBits;
    private isPositionSet;
    constructor(image: HTMLImageElement | ImageData, useCaching?: boolean);
    setPos(x: number, y: number): void;
    setAnchor(x: number, y: number): void;
    test(other: Collider): boolean;
}
export declare function clearCache(): void;
export interface Options {
    pixelTestFunction: (r: number, g: number, b: number, a: number) => boolean;
}
