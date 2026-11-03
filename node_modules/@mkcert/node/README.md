# @mkcert/node

This is a JavaScript wrapper for
[mkcert](https://github.com/FiloSottile/mkcert).

## Installation

```
npm i -D @mkcert/node
```

## Command Line Interface

You can use the `mkcert` command from your npm scripts, or run it directly with
`npx mkcert`.

```json
{
  "scripts": {
    "generate-certs": "mkcert -install -key-file key.pem -cert-file cert.pem example.com *.example.com"
  }
}
```

You can run `npx mkcert -help` to view options.

## JavaScript API

You can generate certificates using a JavaScript API.

```js
import * as mkcert from "@mkcert/node";

await mkcert.generate({
  install: true,
  hosts: ["localhost"],
  certFile: "./cert.pem",
  keyFile: "./key.pem"
});
```

### `install` / `installSync`

Install the local CA in the system trust store.

- **Type:**

```ts
/** Install the local CA in the system trust store. */
function install(): Promise<void>;

/** Install the local CA in the system trust store. */
function installSync(): void;
```

### `uninstall` / `uninstallSync`

Uninstall the local CA (but do not delete it).

- **Type:**

```ts
/** Uninstall the local CA (but do not delete it). */
function uninstall(): Promise<void>;

/** Uninstall the local CA (but do not delete it). */
function uninstallSync(): void;
```

### `generate` / `generateSync`

Generate a certificate.

- **Type:**

```ts
interface MkcertGenerateOptions {
  /** Custom hosts to generate the certificates for (ex: `"localhost"`) */
  hosts: string[];
  /** Customize the output paths. */
  certFile?: string;
  /** Customize the output paths. */
  keyFile?: string;
  /** Customize the output paths. */
  p12File?: string;
  /** Generate a certificate for client authentication. */
  client?: boolean;
  /** Generate a certificate with an ECDSA key. */
  ecdsa?: boolean;
  /** Generate a ".p12" PKCS #12 file, also know as a ".pfx" file, containing certificate and key for legacy applications. */
  pkcs12?: boolean;
  /** Set the CA certificate and key storage location. (This allows maintaining multiple local CAs in parallel.) */
  caroot?: string;
  /** A comma-separated list of trust stores to install the local root CA into. Options are: `"system"`, `"java"` and `"nss"` (includes Firefox). Autodetected by default. */
  trustStores?: TrustStore[];
  /** Install the local CA in the system trust store. (default: `false`) */
  install?: boolean;
  cwd?: string;
}

/** Generate a certificate. */
function generate(options: MkcertGenerateOptions): Promise<void>;

/** Generate a certificate. */
function generateSync(options: MkcertGenerateOptions): void;
```

### `caroot` / `carootSync`

Returns the CA certificate and key storage location.

- **Type:**

```ts
/** Return the CA certificate and key storage location. */
function caroot(): Promise<string>;

/** Return the CA certificate and key storage location. */
function carootSync(): string;
```

## Usage with Node.js

Node does not use the system root store, so it won't accept mkcert certificates
automatically. Instead, you will have to set the `NODE_EXTRA_CA_CERTS`
environment variable.

```bash
export NODE_EXTRA_CA_CERTS="$(npx mkcert -CAROOT)/rootCA.pem"
```
