const crypto=require('crypto');
const SECRET='secret';
const header={alg:'HS256',typ:'JWT'};
const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
function makeToken(payload){
  const bodyB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = headerB64 + '.' + bodyB64;
  const sig = crypto.createHmac('sha256',SECRET).update(data).digest('base64url');
  return data + '.' + sig;
}
const now=Math.floor(Date.now()/1000);
console.log('valid', makeToken({sub:'123',name:'Valid User',iat:now,exp:now+3600}));
console.log('expired', makeToken({sub:'123',name:'Expired User',iat:now-7200,exp:now-3600}));
