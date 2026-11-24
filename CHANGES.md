# Changes

## 2.0.0 2026-11-22

First entry of this change log. Earlier versions are on npm and in the git
history.

* Seneca 4: the peer dependency is `seneca` `^4.0.0` (was
  `>=3||>=4.0.0-rc2`). Seneca 3 users stay on `@seneca/gateway-express@1`.
* The peer dependency `@seneca/gateway` is `^2.0.0` (was `>=1.3.0`), the
  Seneca 4 release of the gateway.
* Node.js 24 or later (`engines.node` `>=24`).
* The peer dependency `seneca-promisify` is removed. Seneca 4 has
  promises built in, and the tests no longer load the plugin (D4).
* The option defaults are built with the validator that Seneca passes to
  the plugin: `defaults` is now a function of `{ valid }` (B1). Seneca 4
  validates options with shape and rejects defaults built with Gubu, so
  1.0.0 stops at startup there with `plugin_gubu_shape`. The gubu import
  is removed; gubu was never a declared dependency. The option keys and
  values are unchanged. `auth.cookie` stays open, so it accepts cookie
  fields that the defaults do not name, such as `domain`. Other unknown
  option keys, at the top level or in `auth.token` and `error`, are
  rejected with `invalid_plugin_option` (B13).
* TypeScript: the plugin function is typed `this: Seneca.Instance`, with
  a type-only import of `seneca` (B10).
* The tests load plugins by their full names (`@seneca/gateway`, B14) and
  cover the auth cookie, the `modify` options, the response directives and
  the webhook handler. The example in `example/basic` no longer loads
  `promisify`, `entity` or `repl`, and loads `@seneca/gateway` by its full
  name.
