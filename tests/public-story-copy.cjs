'use strict';
// Read-only live marketing-source probe. The payload remains in memory and is never logged.
const ATTEMPTS=3,TIMEOUT_MS=45000,BACKOFF_MS=1000;
const HOSTS=new Set(['script.google.com','script.googleusercontent.com']);
const RETRY_STATUS=new Set([429,502,503,504]);
const RETRY_CODE=new Set(['ETIMEDOUT','ECONNRESET','ECONNREFUSED','EAI_AGAIN','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_BODY_TIMEOUT','UND_ERR_SOCKET']);
function safeError(name,message){const error=new Error(message);error.name=name;return error;}
function publicUrl(value){
 let url;try{url=new URL(value);}catch(_){throw safeError('PublicSourceUrlError','The public source must be a Google HTTPS URL.');}
 if(url.protocol!=='https:'||!HOSTS.has(url.hostname)||url.username||url.password||url.port||url.hash)throw safeError('PublicSourceUrlError','The public source must be a Google HTTPS URL.');
 return url;
}
function isTransient(error){return error?.name==='TimeoutError'||error?.name==='AbortError'||RETRY_CODE.has(error?.code)||RETRY_CODE.has(error?.cause?.code);}
function createReader({fetchImpl=globalThis.fetch,wait=ms=>new Promise(resolve=>setTimeout(resolve,ms)),log=item=>console.log(JSON.stringify(item)),now=()=>Date.now()}={}){
 return async function read(value){
  const initial=publicUrl(value);
  for(let attempt=1;attempt<=ATTEMPTS;attempt++){
   const start=now();let status=null,finalHost=initial.hostname,contentType=null;
   try{
    const requestUrl=new URL(initial.href);requestUrl.searchParams.set('t',String(now()));
    const response=await fetchImpl(requestUrl.href,{method:'GET',redirect:'follow',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(TIMEOUT_MS)});
    status=response.status;
    const final=new URL(response.url||initial.href);finalHost=final.hostname;publicUrl(final.href);
    contentType=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(!response.ok){
     try{await response.body?.cancel();}catch(_){}
     const error=safeError('PublicSourceHttpError','The public story source returned HTTP '+status+'.');
     error.retry=RETRY_STATUS.has(status)||(status===404&&final.hostname==='script.googleusercontent.com');throw error;
    }
    let payload;try{payload=await response.json();}catch(error){
     if(isTransient(error))throw error;
     throw safeError('PublicSourceJsonError','The public story source did not return valid JSON.');
    }
    if(!payload||typeof payload!=='object'||Array.isArray(payload))throw safeError('PublicSourceJsonError','The public story source must return a JSON object.');
    log({publicSourceProbe:true,attempt,status,finalHost,contentType,elapsedMs:Math.max(0,now()-start),errorName:null});
    return payload;
   }catch(error){
    const retry=Boolean(error.retry)||isTransient(error);
    const name=error.name?.startsWith('PublicSource')?error.name:isTransient(error)?'PublicSourceTransientError':'PublicSourceReadError';
    log({publicSourceProbe:true,attempt,status,finalHost,contentType,elapsedMs:Math.max(0,now()-start),errorName:name});
    if(!retry||attempt===ATTEMPTS)throw safeError(name,'The public story source could not be read after '+attempt+' attempt'+(attempt===1?'':'s')+(status===null?'.':' (HTTP '+status+').'));
    await wait(BACKOFF_MS);
   }
  }
 };
}
module.exports={read:createReader(),createReader};
