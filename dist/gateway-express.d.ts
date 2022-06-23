declare function gateway_express(this: any, options: any): {
    name: string;
    exports: {
        handler: (req: any, res: any, next: any) => Promise<any>;
        msg: (req: any, res: any, next: any) => Promise<any>;
        hook: (req: any, res: any, next: any) => Promise<any>;
    };
};
declare namespace gateway_express {
    var defaults: {};
}
export default gateway_express;
