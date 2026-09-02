#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {webcrypto}=require('node:crypto');

const allowedPacks=new Set(['light-lab','stage-builder','pro-crew','production-bundle']);
const expectedPublic={x:'f9PxV8hP83InwZHNOEkV1aDwhjR_xqmHNhbvy8UHktE',y:'OQKzbhsR4eQKB_WQTjOjtzKhV9joOmVZqOPjHgGEL7Y'};
const args=process.argv.slice(2);
const option=name=>{const index=args.indexOf('--'+name);return index>=0?args[index+1]:'';};
const fail=message=>{process.stderr.write(message+'\n');process.exit(1);};

async function main(){
  const keyArgument=option('key'),pack=option('pack'),license=option('license'),expires=option('expires');
  if(!keyArgument||!pack||!license)fail('Verwendung: npm run pack-code -- --key /sicherer/pfad/private.jwk --pack light-lab --license bestellung-123 [--expires 2027-09-02]');
  if(!allowedPacks.has(pack))fail('Unbekanntes Pack. Erlaubt: '+[...allowedPacks].join(', '));
  if(!/^[A-Za-z0-9._:-]{1,100}$/.test(license))fail('Die Lizenz-ID darf nur Buchstaben, Zahlen, Punkt, Doppelpunkt, Unterstrich und Bindestrich enthalten.');
  const keyPath=path.resolve(keyArgument),relative=path.relative(process.cwd(),keyPath);
  if(relative===''||(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative)))fail('Der private Schlüssel muss außerhalb des Repositorys gespeichert werden.');
  let privateJwk;try{privateJwk=JSON.parse(fs.readFileSync(keyPath,'utf8'));}catch(error){fail('Der private Schlüssel konnte nicht gelesen werden.');}
  if(privateJwk?.kty!=='EC'||privateJwk.crv!=='P-256'||typeof privateJwk.d!=='string'||privateJwk.x!==expectedPublic.x||privateJwk.y!==expectedPublic.y)fail('Der Schlüssel passt nicht zum öffentlichen Pack-Schlüssel der App.');
  const payload={v:1,pack,license,issuedAt:new Date().toISOString()};
  if(expires){const expiry=Date.parse(expires);if(!Number.isFinite(expiry)||expiry<=Date.now())fail('Das Ablaufdatum muss gültig sein und in der Zukunft liegen.');payload.expiresAt=new Date(expiry).toISOString();}
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url'),key=await webcrypto.subtle.importKey('jwk',privateJwk,{name:'ECDSA',namedCurve:'P-256'},false,['sign']),signature=await webcrypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(body));
  process.stdout.write('SPK1.'+body+'.'+Buffer.from(signature).toString('base64url')+'\n');
}

main().catch(error=>fail(error.message));
