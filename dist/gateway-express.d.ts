import type Seneca from 'seneca';
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
declare function gateway_express(this: Seneca.Instance, options: GatewayExpressOptions): {
    name: string;
    exports: {
        handler: (req: any, res: any, next: any) => Promise<any>;
        hook: (req: any, res: any, next: any) => Promise<any>;
    };
};
declare namespace gateway_express {
    var defaults: ({ valid }: {
        valid: Seneca.Instance["valid"];
    }) => Record<string, any>;
}
export default gateway_express;
