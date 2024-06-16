// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const jsonp = (name:string, src:string, f: (arg0: any) => void) => {
    // https://am-yu.net/2023/06/04/typescript_jsonp_promise/
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[name] = function(data: any){
        f(data);
    }
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = src;
    document.body.appendChild(script);
}