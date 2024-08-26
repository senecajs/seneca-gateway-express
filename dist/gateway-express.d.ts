type GatewayExpressOptions = {
    auth?: {
        token: {
            name: string;
        };
        cookie?: any;
    };
    error?: {
        next: boolean;
    };
    modify?: {
        req?: (req: any) => any;
        res?: (req: any, msg: any, out: any) => any;
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
            cookie: import("gubu").Node<{
                maxAge: number;
                httpOnly: boolean;
                sameSite: boolean;
            }>;
        };
        error: {
            next: boolean;
        };
        modify: {
            req: undefined;
            res: undefined;
        };
    };
}
export default gateway_express;
