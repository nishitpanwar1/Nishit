import crypto from 'crypto';

/**
 * ImageKit Authentication Parameters Generator
 * In Next.js App Router, GET handler generates secure client upload credentials
 * without exposing the IMAGEKIT_PRIVATE_KEY to the browser.
 */
export interface ImageKitAuthResponse {
  token: string;
  expire: number;
  signature: string;
}

export function generateImageKitAuth(customPrivateKey?: string): ImageKitAuthResponse {
  const privateKey =
    customPrivateKey ||
    process.env.IMAGEKIT_PRIVATE_KEY ||
    'private_+zcINue8pC4iqC9+fOVBs+lgxzI=';

  if (!privateKey) {
    throw new Error('IMAGEKIT_PRIVATE_KEY is not defined');
  }

  // Token: unique UUID or random hex string
  const token = crypto.randomUUID();

  // Expiration: Epoch timestamp in seconds (valid for 40 minutes = 2400 seconds)
  const expire = Math.floor(Date.now() / 1000) + 2400;

  // Signature: HMAC-SHA1 of (token + expire) using privateKey as secret key
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  return { token, expire, signature };
}

/**
 * Next.js App Router GET Endpoint: /api/imagekit/auth
 */
export async function GET(): Promise<Response> {
  try {
    const authParams = generateImageKitAuth();

    return Response.json(authParams, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    return Response.json(
      {
        error: 'Failed to generate ImageKit authentication parameters',
        message: error?.message || 'Internal server error',
      },
      { status: 500 }
    );
  }
}
