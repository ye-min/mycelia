import { Component } from '@angular/core';
import { md5, sha1, ripemd160 } from '@noble/hashes/legacy.js';
import { sha256, sha224, sha512_256, sha384, sha512 } from '@noble/hashes/sha2.js';
import { sha3_256, sha3_384, sha3_512 } from '@noble/hashes/sha3.js';
import { bytesToHex } from '@noble/hashes/utils.js';

interface HashResult {
  name: string;
  bits: number;
  value: string;
  copied: boolean;
}

const ALGOS: { name: string; bits: number; fn: (data: Uint8Array) => Uint8Array }[] = [
  { name: 'MD5',       bits: 128, fn: md5 },
  { name: 'SHA-1',     bits: 160, fn: sha1 },
  { name: 'RIPEMD-160',bits: 160, fn: ripemd160 },
  { name: 'SHA-224',   bits: 224, fn: sha224 },
  { name: 'SHA-256',   bits: 256, fn: sha256 },
  { name: 'SHA-512/256', bits: 256, fn: sha512_256 },
  { name: 'SHA-384',   bits: 384, fn: sha384 },
  { name: 'SHA-512',   bits: 512, fn: sha512 },
  { name: 'SHA3-256',  bits: 256, fn: sha3_256 },
  { name: 'SHA3-384',  bits: 384, fn: sha3_384 },
  { name: 'SHA3-512',  bits: 512, fn: sha3_512 },
];

@Component({
  selector: 'app-hash-calc',
  templateUrl: './hash-calc.component.html',
  styleUrls: ['./hash-calc.component.css']
})
export class HashCalcComponent {
  input = '';
  results: HashResult[] = [];
  private enc = new TextEncoder();

  compute(): void {
    if (!this.input) { this.results = []; return; }
    const data = this.enc.encode(this.input);
    this.results = ALGOS.map(a => ({
      name:   a.name,
      bits:   a.bits,
      value:  bytesToHex(a.fn(data)),
      copied: false
    }));
  }

  clear(): void {
    this.input = '';
    this.results = [];
  }

  copy(r: HashResult): void {
    navigator.clipboard.writeText(r.value).then(() => {
      r.copied = true;
      setTimeout(() => (r.copied = false), 1500);
    });
  }

  copyAll(): void {
    const text = this.results.map(r => `${r.name.padEnd(12)} ${r.value}`).join('\n');
    navigator.clipboard.writeText(text);
  }
}
