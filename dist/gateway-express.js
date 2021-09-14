"use strict";
/* Copyright © 2021 Richard Rodger, MIT License. */
Object.defineProperty(exports, "__esModule", { value: true });
function gateway_express(options) {
    const seneca = this;
    const gateway = seneca.export('gateway/handler');
    const parseJSON = seneca.export('gateway/parseJSON');
    seneca.act('sys:gateway,add:hook,hook:delegate', {
        action: (delegate, _json, ctx) => {
            ctx.req.seneca$ = delegate;
        }
    });
    async function handler(req, res, next) {
        const body = req.body;
        const json = 'string' === typeof body ? parseJSON(body) : body;
        if (json.error$) {
            return res.status(400).send(json);
        }
        try {
            const out = await gateway(json, { req, res });
            if (out === null || out === void 0 ? void 0 : out.done$) {
                return next();
            }
            if (out === null || out === void 0 ? void 0 : out.error$) {
                return next(out);
            }
            return res.send(out);
        }
        catch (err) {
            throw err;
        }
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