export const jsonp = (name, src, f) => {
  window[name] = function(data){
    f(data);
  }
  var script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = src;
  document.body.appendChild(script);
}

