"use strict";
/* Copyright © 2021-2022 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
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
    async function msg(req, res, next) {
        var _a;
        const body = req.body;
        const json = 'string' === typeof body ? parseJSON(body) : body;
        // TODO: doc as a standard feature
        // TODO: implement in other gateways
        json.gateway = {
            params: req.params,
            query: req.query,
        };
        if (json.error$) {
            return res.status(400).send(json);
        }
        // TODO: handle throw errors
        const out = await gateway(json, { req, res });
        if (out && out.handler$) {
            if (out.handler$.done) {
                return next();
            }
            // TODO: move to gateway-auth express handling
            // TODO: provide a hook to use gateway-auth for response modification
            if (out.handler$.login) {
                if (out.handler$.login.token) {
                    res.cookie(options.login.token.name, out.handler$.login.token, {
                        maxAge: 365 * 24 * 60 * 60 * 1000,
                        httpOnly: true,
                        sameSite: true
                    });
                }
                else if (out.handler$.login.remove) {
                    res.clearCookie('seneca-auth');
                }
            }
            // Should be last as final action
            if (out.handler$.redirect) {
                return res.redirect(out.handler$.redirect);
            }
            // TODO: review
            if (((_a = out === null || out === void 0 ? void 0 : out.handler$) === null || _a === void 0 ? void 0 : _a.error) && !options.bypass_express_error_handler) {
                // NOTE: Here we are passing the object with information about
                // the error to the Express' error handler, which allows users
                // to handle errors in their application.
                //
                // This is useful, for example, when you want to return an HTTP
                // 404 for the 'act_not_found' error; - or handle any other error
                // that you defined and threw inside a Seneca instance.
                //
                return next(out);
            }
        }
        return res.send(out);
    }
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
        return msg(req, res, next);
    }
    return {
        name: 'gateway-express',
        exports: {
            // DEPRECATE
            handler: msg,
            msg,
            hook,
        }
    };
}
// Default options.
gateway_express.defaults = {
    login: {
        token: {
            name: 'seneca-auth'
        }
    },
    // TODO: review
    bypass_express_error_handler: false
};
exports.default = gateway_express;
if ('undefined' !== typeof (module)) {
    module.exports = gateway_express;
}
//# sourceMappingURL=gateway-express.js.map