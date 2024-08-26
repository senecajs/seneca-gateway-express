"use strict";
/* Copyright © 2021-2022 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
const gubu_1 = require("gubu");
function gateway_express(options) {
    const seneca = this;
    const tag = seneca.plugin.tag;
    const gtag = (null == tag || '-' === tag) ? '' : '$' + tag;
    const gateway = seneca.export('gateway' + gtag + '/handler');
    const parseJSON = seneca.export('gateway' + gtag + '/parseJSON');
    seneca.act('sys:gateway,add:hook,hook:delegate', {
        gateway: 'express',
        tag: seneca.plugin.tag,
        action: (_json, ctx) => {
            ctx.req.seneca$ = this;
        }
    });
    async function handler(req, res, next) {
        var _a, _b, _c, _d, _e, _f;
        if ((_a = options.modify) === null || _a === void 0 ? void 0 : _a.req) {
            req = await options.modify.req.call(req.seneca$, req);
        }
        const body = req.body;
        const json = 'string' === typeof body ? parseJSON(body) : body;
        // console.log('BODY', json)
        let headers = null == req.headers ? {} : Object
            .entries(req.headers)
            .reduce((a, entry) => (a[entry[0].toLowerCase()] = entry[1], a), {});
        // TODO: doc as a standard feature
        // TODO: implement in other gateways
        json.gateway = {
            params: req.params || {},
            query: req.query || {},
            body: req.body,
            headers,
        };
        if (json.error$) {
            return res.status(400).send(json);
        }
        let result = await gateway(json, { req, res });
        if ((_b = options.modify) === null || _b === void 0 ? void 0 : _b.res) {
            result = await ((_c = options.modify) === null || _c === void 0 ? void 0 : _c.res.call(req.seneca$, req, json, result));
        }
        let gateway$ = result.gateway$;
        if (gateway$) {
            if (gateway$.done) {
                return res.send(result.out);
            }
            if (gateway$.auth && options.auth) {
                if (gateway$.auth.token) {
                    res.cookie(options.auth.token.name, gateway$.auth.token, {
                        ...options.auth.cookie,
                        ...(gateway$.auth.cookie || {})
                    });
                }
                else if (gateway$.auth.remove) {
                    res.clearCookie(options.auth.token.name);
                }
            }
            // TODO: should also match `headers`
            if (gateway$.header) {
                res.set(gateway$.header);
            }
            if (gateway$.next) {
                // Uses the default express error handler
                return next(result.error ? result.out : undefined);
            }
            // Should be last as final action
            else if ((_d = gateway$.redirect) === null || _d === void 0 ? void 0 : _d.location) {
                return res.redirect((_e = gateway$.redirect) === null || _e === void 0 ? void 0 : _e.location);
            }
            if (result.error) {
                if ((_f = options.error) === null || _f === void 0 ? void 0 : _f.next) {
                    return next(result.error ? result.out : undefined);
                }
                else {
                    res.status(gateway$.status || 500);
                    return res.send(result.out);
                }
            }
            else {
                if (gateway$.status) {
                    res.status(gateway$.status);
                }
                return res.send(result.out);
            }
        }
        else {
            return res.send(result.out);
        }
    }
    // Named webhook handler
    async function hook(req, res, next) {
        const body = req.body || {};
        const name = req.params.name;
        const code = req.params.code;
        // Standard message for hooks based on URL path format:
        // /prefix/:name/:code
        const hookmsg = {
            handle: 'hook',
            name,
            code,
            body: 'string' === typeof body ? parseJSON(body) : body
        };
        req.body = hookmsg;
        return handler(req, res, next);
    }
    return {
        name: 'gateway-express',
        exports: {
            handler,
            hook,
        }
    };
}
// Default options.
gateway_express.defaults = {
    auth: {
        token: {
            name: 'seneca-auth'
        },
        cookie: (0, gubu_1.Open)({
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: true,
        })
    },
    error: {
        next: false
    },
    modify: {
        req: undefined,
        res: undefined,
    }
};
exports.default = gateway_express;
if ('undefined' !== typeof (module)) {
    module.exports = gateway_express;
}
//# sourceMappingURL=gateway-express.js.map