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
                // NOTE: Here we are passing the object with information about
                // the error to the Express error handler, which allows users
                // to handle errors in their Express error handler.
                //
                // This is useful, for example, when you want to return an HTTP
                // 404 for the 'act_not_found' error; - or any other user-defined
                // error thrown inside a Seneca instance.
                //
                return next(out);
            }
            return res.send(out);
        }
        catch (err) {
            /* NOTE: Since the `gateway` function should not normally throw, and
             * all errors coming from the underlying Seneca instance are handled
             * by it, - we assume that if something does throw, it's nothing that
             * can be adequately handled. Hence, we do not pass this error to the
             * Express handler.
             */
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