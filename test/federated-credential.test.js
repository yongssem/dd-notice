import { test, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { ExternalAccountClient, OAuth2Client } from 'google-auth-library';
import { createFederatedAuth, createServerFirestore } from '../server/firestore.js';

afterEach(() => mock.restoreAll());
const config = {
  GCP_PROJECT_ID: 'demo-dd-notice-wif',
  GCP_PROJECT_NUMBER: '123456789',
  GCP_SERVICE_ACCOUNT_EMAIL: 'notice@demo-dd-notice-wif.iam.gserviceaccount.com',
  GCP_WORKLOAD_IDENTITY_POOL_ID: 'vercel',
  GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID: 'notice',
};
test('GCP federation emits the trusted exchange configuration and uses a short-lived auth client', async () => {
  let emitted;
  mock.method(ExternalAccountClient, 'fromJSON', options => {
    emitted = options;
    const client = new OAuth2Client();
    client.setCredentials({ access_token: 'synthetic-short-lived-token', expiry_date: Date.now() + 900000 });
    return client;
  });
  const auth = createFederatedAuth(config);
  assert.equal(emitted.audience, '//iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/vercel/providers/notice');
  assert.equal(emitted.token_url, 'https://sts.googleapis.com/v1/token');
  assert.equal(emitted.service_account_impersonation_url, 'https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/notice@demo-dd-notice-wif.iam.gserviceaccount.com:generateAccessToken');
  assert.deepEqual(emitted.scopes, ['https://www.googleapis.com/auth/datastore']);
  assert.equal(typeof emitted.subject_token_supplier.getSubjectToken, 'function');
  assert.equal((await auth.getRequestHeaders()).get('authorization'), 'Bearer synthetic-short-lived-token');
});
test('Firestore initializes through the supported GoogleAuth path without a private key', async () => {
  mock.method(ExternalAccountClient, 'fromJSON', () => new OAuth2Client());
  const db = createServerFirestore(config);
  assert.equal(db.projectId, 'demo-dd-notice-wif');
  await db.terminate();
});
test('missing federation values or an invalid identity client fail closed', () => {
  const incomplete = { ...config };
  delete incomplete.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID;
  assert.throws(() => createServerFirestore(incomplete), /configuration/i);
  mock.method(ExternalAccountClient, 'fromJSON', () => null);
  assert.throws(() => createServerFirestore(config), /configuration/i);
});
test('emulator credentials are accepted only for the explicit loopback demo test project', async () => {
  assert.throws(() => createServerFirestore({ FIREBASE_PROJECT_ID: 'real-project', NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8787' }), /isolated/);
  assert.throws(() => createServerFirestore({ FIREBASE_PROJECT_ID: 'demo-synthetic', NODE_ENV: 'production', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8787' }), /isolated/);
  assert.throws(() => createServerFirestore({ FIREBASE_PROJECT_ID: 'demo-synthetic', NODE_ENV: 'test', FIRESTORE_EMULATOR_HOST: 'other.example:8787' }), /isolated/);
});
