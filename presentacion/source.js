(function(root){'use strict';
root.YOD_PUBLIC_COPY={url:'https://script.google.com/macros/s/AKfycbw3EB-6Q9Mq-ouDU-JvKMrRUaw4auYVeGkKja783yJ7_dEpCOW8xoMhs8IQMDojmlDB3A/exec?recurso=textos'};
root.YodPublicCopy=async function(fetcher=window.fetch.bind(window)){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{const response=await fetcher(root.YOD_PUBLIC_COPY.url,{cache:'no-store',credentials:'omit',signal:controller.signal});if(!response.ok)throw Error('No se pudo consultar el contenido.');return await response.json();}
 finally{clearTimeout(timer);}
};
})(typeof window==='undefined'?globalThis:window);
