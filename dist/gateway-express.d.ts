declare function gateway_express(this: any, options: any): {
    name: string;
    exports: {
        handler: (req: any, res: any, next: any) => Promise<any>;
        msg: (req: any, res: any, next: any) => Promise<any>;
        hook: (req: any, res: any, next: any) => Promise<any>;
    };
};
declare namespace gateway_express {
    var defaults: {
        login: {
            token: {
                name: string;
            };
        };
        bypass_express_error_handler: boolean;
    };
}
export default gateway_express;
