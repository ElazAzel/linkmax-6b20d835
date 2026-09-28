import { md5Hex } from './md5.ts';

function assertEquals(actual: string, expected: string) {
  if (actual !== expected) throw new Error(`expected ${expected}, got ${actual}`);
}

Deno.test('md5Hex matches RFC 1321 test vectors', () => {
  assertEquals(md5Hex(''), 'd41d8cd98f00b204e9800998ecf8427e');
  assertEquals(md5Hex('a'), '0cc175b9c0f1b6a831c399e269772661');
  assertEquals(md5Hex('abc'), '900150983cd24fb0d6963f7d28e17f72');
  assertEquals(md5Hex('message digest'), 'f96b697d7cb7938d525a2f31aaf161d0');
  assertEquals(md5Hex('abcdefghijklmnopqrstuvwxyz'), 'c3fcd3d76192e4007dfb496cca67e13b');
  assertEquals(
    md5Hex('12345678901234567890123456789012345678901234567890123456789012345678901234567890'),
    '57edf4a22be3c955ac49da2e2107b67a',
  );
});

// Эталоны посчитаны через node:crypto createHash('md5')
Deno.test('md5Hex handles UTF-8 and Robokassa signature strings', () => {
  assertEquals(md5Hex('Оплата lnkmx.my PRO (12 мес)'), 'c77d504b8ca9da34480d233139c9637e');
  assertEquals(
    md5Hex('1500:123456789:pass2:shp_period=12:shp_plan=pro:shp_related_id=:shp_type=subscription:shp_user=0b1c:shp_zone='),
    '97a5791ccaadf36cd40d5d1d9bd7a648',
  );
});

Deno.test('md5Hex is correct around 64-byte block boundaries', () => {
  const expected: Record<number, string> = {
    55: '04364420e25c512fd958a70738aa8f72',
    56: '668a72d5ba17f08e62dabcafad6db14b',
    57: '693037871c4a9d3d8685018905cb530a',
    63: '7dc2ca208106a2f703567bdff99d8981',
    64: 'c1bb4f81d892b2d57947682aeb252456',
    65: '1bc932052302d074bdec39795fe00cf6',
    119: 'ab347a5f68c8a443cfcddc633f12c24f',
    120: 'fb98667f98096de92620b64f46e1c5b5',
  };
  for (const [len, hash] of Object.entries(expected)) {
    assertEquals(md5Hex('x'.repeat(Number(len))), hash);
  }
});
