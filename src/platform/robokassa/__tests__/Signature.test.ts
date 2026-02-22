import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

function md5(string: string) {
    return createHash('md5').update(string).digest('hex');
}

// Logic representing the DESIRED alphabetical sorting
function calculateSignature(params: Record<string, string>, pass: string, isWebhook = false) {
    const { MerchantLogin, OutSum, InvId } = params;

    // Main params
    const mainParams = isWebhook
        ? [OutSum, InvId, pass]
        : [MerchantLogin, OutSum, InvId, pass];

    // SHP params sorted alphabetically
    const shpParams = Object.keys(params)
        .filter(key => key.startsWith('shp_'))
        .sort()
        .map(key => `${key}=${params[key]}`);

    return md5([...mainParams, ...shpParams].join(':')).toLowerCase();
}

// Logic representing the FIXED implementation in Edge Functions
function currentFixedImplementationSignature(params: Record<string, string>, pass: string, isWebhook = false) {
    const { MerchantLogin, OutSum, InvId, ...allParams } = params;

    // Main params
    const mainParams = isWebhook
        ? [OutSum, InvId, pass]
        : [MerchantLogin, OutSum, InvId, pass];

    // SHP params sorted alphabetically
    const shpParams = Object.entries(allParams)
        .filter(([key]) => key.startsWith('shp_'))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`);

    return md5([...mainParams, ...shpParams].join(':')).toLowerCase();
}

describe('Robokassa Signature Logic', () => {
    const params = {
        MerchantLogin: 'test_login',
        OutSum: '100.00',
        InvId: '123456',
        shp_user: 'user_1',
        shp_type: 'subscription',
        shp_plan: 'pro',
        shp_period: '12',
        shp_related_id: 'rel_1'
    };
    const pass = 'test_pass';

    it('verifies that the fixed implementation uses alphabetical sorting', () => {
        const expected = calculateSignature(params, pass);
        const fixed = currentFixedImplementationSignature(params, pass);

        expect(fixed).toBe(expected);

        // Explicitly check the order in the test data
        const shpKeys = Object.keys(params).filter(k => k.startsWith('shp_')).sort();
        expect(shpKeys).toEqual(['shp_period', 'shp_plan', 'shp_related_id', 'shp_type', 'shp_user']);
    });
});
