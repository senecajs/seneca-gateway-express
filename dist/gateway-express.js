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
    async function handler(req, res, next) {
        var _a, _b;
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
        const out = await gateway(json, { req, res });
        if ((_a = out === null || out === void 0 ? void 0 : out.handler$) === null || _a === void 0 ? void 0 : _a.done) {
            return next();
        }
        // TODO: review
        if (((_b = out === null || out === void 0 ? void 0 : out.handler$) === null || _b === void 0 ? void 0 : _b.error) && !options.bypass_express_error_handler) {
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
        return res.send(out);
    }
    return {
        name: 'gateway-express',
        exports: {
            handler
        }
    };
}
// Default options.
gateway_express.defaults = {};
exports.default = gateway_express;
if ('undefined' !== typeof (module)) {
    module.exports = gateway_express;
}
//# sourceMappingURL=gateway-express.js.map