import { Firestore } from '@google-cloud/firestore';
import { ExternalAccountClient, GoogleAuth } from 'google-auth-library';
import { getVercelOidcToken } from '@vercel/oidc';

export function createFederatedAuth(env = process.env) {
  const { GCP_PROJECT_ID, GCP_PROJECT_NUMBER, GCP_SERVICE_ACCOUNT_EMAIL, GCP_WORKLOAD_IDENTITY_POOL_ID, GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID } = env;
  if (![GCP_PROJECT_ID, GCP_PROJECT_NUMBER, GCP_SERVICE_ACCOUNT_EMAIL, GCP_WORKLOAD_IDENTITY_POOL_ID, GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID].every(Boolean)) {
    throw new Error('Server configuration unavailable.');
  }
  const authClient = ExternalAccountClient.fromJSON({
    type: 'external_account',
    audience: '//iam.googleapis.com/projects/' + GCP_PROJECT_NUMBER + '/locations/global/workloadIdentityPools/' + GCP_WORKLOAD_IDENTITY_POOL_ID + '/providers/' + GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID,
    subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
    token_url: 'https://sts.googleapis.com/v1/token',
    service_account_impersonation_url: 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/' + GCP_SERVICE_ACCOUNT_EMAIL + ':generateAccessToken',
    scopes: ['https://www.googleapis.com/auth/datastore'],
    subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
  });
  if (!authClient) throw new Error('Server configuration unavailable.');
  return new GoogleAuth({ projectId: GCP_PROJECT_ID, authClient });
}

export function createServerFirestore(env = process.env) {
  const projectId = env.GCP_PROJECT_ID || env.FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error('Server configuration unavailable.');
  if (env.FIRESTORE_EMULATOR_HOST) {
    if (env.NODE_ENV !== 'test' || !projectId.startsWith('demo-')
      || env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8787') {
      throw new Error('Emulator access is restricted to isolated tests.');
    }
    return new Firestore({ projectId, host: env.FIRESTORE_EMULATOR_HOST, ssl: false, universeDomain: 'googleapis.com' });
  }
  if (env.GCP_PROJECT_ID) {
    return new Firestore({ projectId, auth: createFederatedAuth(env), preferRest: true });
  }
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) throw new Error('Server configuration unavailable.');
  return new Firestore({ projectId, credentials: { client_email: clientEmail, private_key: privateKey }, preferRest: true });
}

let database;
export function getServerFirestore() {
  return database ??= createServerFirestore();
}
