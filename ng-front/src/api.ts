const API_SERVER = import.meta.env.VITE_API_SERVER

export const sendSearchCache = (user:string, keyword:string) => {
    const f = new FormData()
    f.append('keyword', keyword)
    f.append('user', user)
    const req = new Request(API_SERVER + "/search-cache", {
      method: "POST",
      credentials: "include", // for save another domain
      headers: {
        'Accept': 'applicatoin/json',
      },
      body: f,
    })
    return fetch(req)
  }

export const sendSearch = (user:string, keyword:string, noCache:boolean) => {
    const f = new FormData()
    f.append('keyword', keyword)
    f.append('user', user)
    f.append('noCache', noCache?"1":"0")
    const req = new Request(API_SERVER + "/search", {
      method: "POST",
      credentials: "include", // for save another domain
      headers: {
        'Accept': 'applicatoin/json',
      },
      body: f,
    })
    return fetch(req)
  }
