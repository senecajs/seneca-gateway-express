declare type GatewayExpressOptions = {
    auth?: {
        token: {
            name: string;
        };
        cookie?: any;
    };
    error?: {
        next: boolean;
    };
};
declare function gateway_express(this: any, options: GatewayExpressOptions): {
    name: string;
    exports: {
        handler: (req: any, res: any, next: any) => Promise<any>;
        hook: (req: any, res: any, next: any) => Promise<any>;
    };
};
declare namespace gateway_express {
    var defaults: {
        auth: {
            token: {
                name: string;
            };
            cookie: import("gubu").Node & {
                [name: string]: any;
            };
        };
        error: {
            next: boolean;
        };
    };
}
export default gateway_express;
