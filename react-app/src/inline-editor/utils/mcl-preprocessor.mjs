const API_SERVER=process.env.REACT_APP_API_SERVER
let globalIncludeCache = {}

function extractBlocks(s){
  let inBlock = false
  let blockBody
  let blockType
  let blocks = []
  s.split("\n").forEach((l) => {
    if(inBlock){
      if(l === "<<"){
        inBlock = false
        blocks.push({blockType: blockType, body: blockBody})
      }else{
        blockBody += "\n" + l
      }
    }else{
      let parts = l.split(/\s+/)
      if(parts[0] == ">>"){
        inBlock = true
        blockBody = ""
        blockType = parts[1]
      }
    }
  })
  return blocks
}

export async function preprocess(s, user){
  let ret = s.split("\n").map(async(l) => {
    if(l.indexOf("#include(") == 0){
      let parts = l.split(/["]/)
      let name = parts[1]
      let blocks;
      if(globalIncludeCache[name] == undefined){
        const fetchFile = await fetch(API_SERVER + "/page/" + user + "/" + encodeURIComponent(name))
        const page = await fetchFile.json()
        blocks = extractBlocks(page.body)
        globalIncludeCache[name] = blocks
      }else{
        blocks = globalIncludeCache[name]
      }
      let mceSources = blocks.filter((b) => b.blockType=="mce").map((b) => preprocess(b.body, user), "")

      return (await Promise.all(mceSources)).join("\n")
    }else{
      return l
    }
  })
  console.log(ret)
  let l = await Promise.all(ret)
  console.log(l)
  return l.join("\n")
}
