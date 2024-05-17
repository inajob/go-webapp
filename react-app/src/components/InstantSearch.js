import React from 'react';

class InstantSearch extends React.Component{
  render() {
    let sorter = (list) => {
      let out = []
      let out2 = []
      // push not diary page
      list.forEach((item) => {
        if(item.id && null == item.id.match(/\d{4}-\d{2}-\d{2}/)){
          out.push(item)
        }else{
          out2.push(item)
        }
      })
      return out.concat(out2)
    }
    return (
      <div className="instant-search">
        {Object.keys(this.props.item).map((k, j) => (
          <div className="piece" key={j}>
            <div>Search result of '{k}'</div>
            <div className="pages">
            {sorter(this.props.item[k]).slice(0,20).map((r, i) => (
              <li key={i}>
                {r.url?
                  (<div>
                    <a href={r.url}>{r.id}</a>
                  </div>):
                  (<div>
                    <a href={"?user=" + r.user + "&id=" + r.id} data-jump={r.id}>{r.id}</a>
                    <a href={"?user=" + r.user + "&id=" + r.id} data-id={r.id}>*</a>
                  </div>)
                }
                <div>
                  {(() => {if(r.cover) return <img src={r.cover} alt="cover" />})()}
                  {r.text}
                </div>
              </li>
            ))}
            </div>
          </div>
        ))}
      </div>
    )
  }
}
export default InstantSearch
