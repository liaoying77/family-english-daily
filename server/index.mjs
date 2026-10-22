import http from 'node:http';
import {readFile,realpath,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {timingSafeEqual} from 'node:crypto';
import {coachResponse} from './coach.mjs';
const publicRoot=fileURLToPath(new URL('../public/',import.meta.url));
const host=process.env.HOST||'127.0.0.1';const port=Number(process.env.PORT||3000);
const password=process.env.APP_PASSWORD||'';
if(!['127.0.0.1','localhost','::1'].includes(host)&&!password){console.error('Set APP_PASSWORD before exposing the server beyond localhost.');process.exit(1)}
function authorized(header){if(!password)return true;if(!header?.startsWith('Basic '))return false;try{const raw=Buffer.from(header.slice(6),'base64').toString('utf8'),given=Buffer.from(raw.slice(raw.indexOf(':')+1)),expected=Buffer.from(password);return given.length===expected.length&&timingSafeEqual(given,expected)}catch{return false}}
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.md':'text/markdown; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
async function sendWeb(res,response){res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}
export const server=http.createServer(async(req,res)=>{try{
 if(!authorized(req.headers.authorization)){res.writeHead(401,{'WWW-Authenticate':'Basic realm="Family English", charset="UTF-8"','Cache-Control':'no-store'});res.end('Sign in with your shared application password.');return}
 const base=process.env.PUBLIC_ORIGIN||`http://${req.headers.host||'localhost'}`;const url=new URL(req.url,base);
 if(url.pathname==='/api/coach'||url.pathname==='/api/coach/status'){
  let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>16000){res.writeHead(413);res.end('Input too large');return}chunks.push(chunk)}
  const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(typeof v==='string')headers.set(k,v);
  const request=new Request(url,{method:req.method,headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});
  // The standalone server enforces local-only binding or password authentication above.
  await sendWeb(res,await coachResponse(request,{OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL},{dev:true}));return;
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
 let name=decodeURIComponent(url.pathname);if(name==='/'||name==='/learn/'||name==='/learn/index.html')name='/index.html';
 if(name.includes('\0')||name.split('/').some(p=>p==='..'||p.startsWith('.'))){res.writeHead(404);res.end();return}
 const file=path.resolve(publicRoot,'.'+name);const real=await realpath(file).catch(()=>null);
 if(!real||!real.startsWith(publicRoot)||(await stat(real)).isDirectory()){res.writeHead(404);res.end('Not found');return}
 const data=await readFile(real);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
}catch{if(!res.headersSent)res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end('Request failed.')}});
server.listen(port,host,()=>{const addr=server.address();console.log(`Family English: http://${host}:${addr.port}`)});
